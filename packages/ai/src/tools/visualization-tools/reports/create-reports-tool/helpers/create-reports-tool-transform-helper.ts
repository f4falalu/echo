import type { ResponseMessage, ResponseMessageReasoningEntry } from '@buster/server-shared';
import type { CreateReportStateFile, CreateReportsState } from '../create-reports-tool';

// Transform state file to response file format
function transformStateFileToResponseFile(file: CreateReportStateFile) {
  return {
    id: file.id,
    file_name: file.file_name ?? 'Untitled Report',
    file_type: file.file_type,
    status: file.status,
    file: file.file,
    version_number: file.version_number,
  };
}

// Create reasoning entry for create reports tool
export function createCreateReportsReasoningEntry(
  state: CreateReportsState,
  toolCallId: string
): ResponseMessageReasoningEntry | undefined {
  if (!state.files || state.files.length === 0) {
    return undefined;
  }

  return {
    id: `reasoning-${toolCallId}`,
    agentName: 'analyst',
    agentId: 'analyst',
    toolName: 'createReports',
    toolCallId,
    type: 'tool',
    content: {
      argsText: state.argsText ?? '',
      files: state.files.map(transformStateFileToResponseFile),
    },
  };
}

// Create raw LLM message entry for create reports tool
export function createCreateReportsRawLlmMessageEntry(
  state: CreateReportsState,
  toolCallId: string
): ResponseMessage | undefined {
  if (!state.files || state.files.length === 0) {
    return undefined;
  }

  return {
    role: 'assistant',
    content: [
      {
        type: 'tool-call',
        toolCallId,
        toolName: 'createReports',
        args: {
          files: state.files.map((file) => ({
            name: file.file_name ?? 'Untitled Report',
            content: (file.file as { text?: string })?.text ?? '',
          })),
        },
      },
    ],
  };
}
