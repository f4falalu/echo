import type {
  ChatMessageReasoningMessage,
  ChatMessageReasoningMessage_File,
} from '@buster/server-shared/chats';
import type { ModelMessage } from 'ai';
import { formatElapsedTime } from '../../../../shared/format-elapsed-time';
import { MODIFY_DASHBOARDS_TOOL_NAME, type ModifyDashboardsState } from '../modify-dashboards-tool';

/**
 * Create a reasoning entry for modify-dashboards tool
 */
export function createModifyDashboardsReasoningEntry(
  state: ModifyDashboardsState,
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
    // Skip undefined entries or entries that do not yet have an id
    if (!f || !f.id) continue;
    const id = f.id;
    fileIds.push(id);
    filesRecord[id] = {
      id,
      file_type: 'dashboard_file',
      file_name: f.file_name || `Dashboard ${id}`,
      version_number: f.version_number,
      status: f.status,
      file: {
        text: f.file?.text || '',
      },
    };
  }

  // If nothing valid to show yet, skip emitting a files reasoning message
  if (fileIds.length === 0) return undefined;

  // Calculate title and status based on completion state
  let title = 'Modifying dashboards...';
  let status: 'loading' | 'completed' | 'failed' = 'loading';

  // Check if all files have been processed (state has completion status)
  const completedFiles = state.files.filter((f) => f?.status === 'completed').length;
  const failedFiles = state.files.filter((f) => f?.status === 'failed').length;
  const totalFiles = state.files.length;

  // If all files have a final status, we're complete
  const isComplete = completedFiles + failedFiles === totalFiles && totalFiles > 0;
  if (isComplete) {
    if (failedFiles === 0) {
      title = `Modified ${completedFiles} ${completedFiles === 1 ? 'dashboard_file' : 'dashboards'}`;
      status = 'completed';
    } else if (completedFiles === 0) {
      title = `Failed to modify ${failedFiles} ${failedFiles === 1 ? 'dashboard_file' : 'dashboards'}`;
      status = 'failed';
    } else {
      title = `Modified ${completedFiles} of ${totalFiles} dashboards`;
      status = 'failed'; // Partial success is considered failed
    }
  }

  // Calculate elapsed time if complete
  const secondaryTitle = isComplete ? formatElapsedTime(state.startTime) : undefined;

  return {
    id: toolCallId,
    type: 'files',
    title,
    status,
    secondary_title: secondaryTitle,
    file_ids: fileIds,
    files: filesRecord,
  } as ChatMessageReasoningMessage;
}

/**
 * Create a raw LLM message entry for modify-dashboards tool
 */
export function createModifyDashboardsRawLlmMessageEntry(
  state: ModifyDashboardsState,
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
        toolName: MODIFY_DASHBOARDS_TOOL_NAME,
        input: {
          files: state.files
            .filter((file) => file != null) // Filter out null/undefined entries first
            .map((file) => ({
              id: file.id,
              yml_content: file.file?.text ?? '',
            }))
            // Filter out clearly invalid entries
            .filter((f) => f.id && f.yml_content),
        },
      },
    ],
  } as ModelMessage;
}
