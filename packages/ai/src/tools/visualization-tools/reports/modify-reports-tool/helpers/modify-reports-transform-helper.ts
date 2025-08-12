import type { ResponseMessage, ResponseMessageReasoningEntry } from '@buster/server-shared/chats';
import type { ModifyReportsEditState, ModifyReportsState } from '../modify-reports-tool';

// Transform state edit to response edit format
function transformStateEditToResponseEdit(edit: ModifyReportsEditState) {
  return {
    operation: edit.operation,
    code_to_replace: edit.code_to_replace,
    code: edit.code,
    status: edit.status,
    error: edit.error,
  };
}

// Create reasoning entry for modify reports tool
export function createModifyReportsReasoningEntry(
  state: ModifyReportsState,
  toolCallId: string
): ResponseMessageReasoningEntry | undefined {
  if (!state.reportId && !state.edits?.length) {
    return undefined;
  }

  return {
    id: `reasoning-${toolCallId}`,
    agentName: 'analyst',
    agentId: 'analyst',
    toolName: 'modifyReports',
    toolCallId,
    type: 'tool',
    content: {
      argsText: state.argsText ?? '',
      reportId: state.reportId ?? '',
      reportName: state.reportName ?? 'Untitled Report',
      edits: state.edits?.map(transformStateEditToResponseEdit) ?? [],
      currentContent: state.currentContent,
      finalContent: state.finalContent,
      version_number: state.version_number,
    },
  };
}

// Create raw LLM message entry for modify reports tool
export function createModifyReportsRawLlmMessageEntry(
  state: ModifyReportsState,
  toolCallId: string
): ResponseMessage | undefined {
  if (!state.reportId || !state.edits?.length) {
    return undefined;
  }

  return {
    role: 'assistant',
    content: [
      {
        type: 'tool-call',
        toolCallId,
        toolName: 'modifyReports',
        args: {
          id: state.reportId,
          name: state.reportName ?? 'Untitled Report',
          edits: state.edits.map((edit) => ({
            code_to_replace: edit.code_to_replace,
            code: edit.code,
          })),
        },
      },
    ],
  };
}
