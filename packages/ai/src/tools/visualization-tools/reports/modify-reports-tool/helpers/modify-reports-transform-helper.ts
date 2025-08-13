import type {
  ChatMessageReasoningMessage,
  ChatMessageReasoningMessage_File,
} from '@buster/server-shared/chats';
import type { ModelMessage } from 'ai';
import { MODIFY_REPORTS_TOOL_NAME, type ModifyReportsState } from '../modify-reports-tool';

/**
 * Create a reasoning entry for modify-reports tool
 */
export function createModifyReportsReasoningEntry(
  state: ModifyReportsState,
  toolCallId: string
): ChatMessageReasoningMessage | undefined {
  state.toolCallId = toolCallId;

  if (!state.reportId && !state.edits?.length) {
    return undefined;
  }

  // Build Record<string, ReasoningFile> as required by schema
  const filesRecord: Record<string, ChatMessageReasoningMessage_File> = {};
  const fileIds: string[] = [];

  if (state.reportId && state.reportName) {
    const id = state.reportId;
    fileIds.push(id);
    filesRecord[id] = {
      id,
      file_type: 'report',
      file_name: state.reportName,
      version_number: state.version_number || 1,
      status: 'loading',
      file: {
        text: state.currentContent || state.finalContent || '',
      },
    };
  }

  // If nothing valid to show yet, skip emitting a files reasoning message
  if (fileIds.length === 0) return undefined;

  return {
    id: toolCallId,
    type: 'files',
    title: 'Modifying reports...',
    status: 'loading',
    file_ids: fileIds,
    files: filesRecord,
  } as ChatMessageReasoningMessage;
}

/**
 * Create a raw LLM message entry for modify-reports tool
 */
export function createModifyReportsRawLlmMessageEntry(
  state: ModifyReportsState,
  toolCallId: string
): ModelMessage | undefined {
  // If we don't have report data yet, skip emitting raw LLM entry
  if (!state.reportId || !state.edits?.length) return undefined;

  return {
    role: 'assistant',
    content: [
      {
        type: 'tool-call',
        toolCallId,
        toolName: MODIFY_REPORTS_TOOL_NAME,
        input: {
          id: state.reportId,
          name: state.reportName ?? 'Untitled Report',
          edits: state.edits
            .filter((edit) => edit != null) // Filter out null/undefined entries first
            .map((edit) => ({
              code_to_replace: edit.code_to_replace || '',
              code: edit.code || '',
            }))
            // Filter out clearly invalid entries
            .filter((e) => e.code !== undefined),
        },
      },
    ],
  } as ModelMessage;
}
