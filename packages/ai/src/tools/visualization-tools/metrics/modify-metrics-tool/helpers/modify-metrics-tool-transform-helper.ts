import type {
  ChatMessageReasoningMessage,
  ChatMessageReasoningMessage_File,
} from '@buster/server-shared/chats';
import type { ModelMessage } from 'ai';
import { MODIFY_METRICS_TOOL_NAME, type ModifyMetricsState } from '../modify-metrics-tool';

/**
 * Create a reasoning entry for modify-metrics tool
 */
export function createModifyMetricsReasoningEntry(
  state: ModifyMetricsState,
  toolCallId: string
): ChatMessageReasoningMessage | undefined {
  state.toolCallId = toolCallId;

  if (!state.files || state.files.length === 0) {
    return undefined;
  }

  // Build Record<string, ReasoningFile> as required by schema
  const filesRecord: Record<string, ChatMessageReasoningMessage_File> = {};
  const fileIds: string[] = [];
  for (const f of state.files) {
    // Skip undefined entries or entries that do not yet have an ID
    if (!f || !f.id) continue;
    const id = f.id;
    fileIds.push(id);
    filesRecord[id] = {
      id,
      file_type: 'metric',
      file_name: f.file_name || `Metric ${id}`,
      version_number: f.version_number,
      status: f.status,
      file: {
        text: f.file?.text || f.yml_content || '',
      },
    };
  }

  // If nothing valid to show yet, skip emitting a files reasoning message
  if (fileIds.length === 0) return undefined;

  // Determine title based on status
  let title = 'Modifying metrics...';
  const allCompleted = state.files.every((f) => f?.status === 'completed');
  const anyFailed = state.files.some((f) => f?.status === 'failed');

  if (allCompleted) {
    title = `Modified ${fileIds.length} ${fileIds.length === 1 ? 'metric' : 'metrics'}`;
  } else if (anyFailed) {
    const failedCount = state.files.filter((f) => f?.status === 'failed').length;
    const successCount = state.files.filter((f) => f?.status === 'completed').length;
    if (successCount > 0) {
      title = `Modified ${successCount} ${successCount === 1 ? 'metric' : 'metrics'}, ${failedCount} failed`;
    } else {
      title = 'Failed to modify metrics';
    }
  }

  return {
    id: toolCallId,
    type: 'files',
    title,
    status: anyFailed ? 'failed' : allCompleted ? 'completed' : 'loading',
    file_ids: fileIds,
    files: filesRecord,
  } as ChatMessageReasoningMessage;
}

/**
 * Create a raw LLM message entry for modify-metrics tool
 */
export function createModifyMetricsRawLlmMessageEntry(
  state: ModifyMetricsState,
  toolCallId: string
): ModelMessage | undefined {
  // If we don't have files yet, skip emitting raw LLM entry
  if (!state.files || state.files.length === 0) return undefined;

  return {
    role: 'assistant',
    content: [
      {
        type: 'tool-call',
        toolCallId,
        toolName: MODIFY_METRICS_TOOL_NAME,
        input: {
          files: state.files
            .filter((file) => file != null) // Filter out null/undefined entries first
            .map((file) => ({
              id: file.id,
              yml_content: file.yml_content || file.file?.text || '',
            }))
            // Filter out clearly invalid entries
            .filter((f) => f.id && f.yml_content),
        },
      },
    ],
  } as ModelMessage;
}
