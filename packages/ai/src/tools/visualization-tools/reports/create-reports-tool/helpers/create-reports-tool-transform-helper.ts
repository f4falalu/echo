import type {
  ChatMessageReasoningMessage,
  ChatMessageReasoningMessage_File,
} from '@buster/server-shared/chats';
import type { ModelMessage } from 'ai';
import { formatElapsedTime } from '../../../../shared/format-elapsed-time';
import {
  CREATE_REPORTS_TOOL_NAME,
  type CreateReportStateFile,
  type CreateReportsState,
} from '../create-reports-tool';

/**
 * Create a reasoning entry for create-reports tool
 */
export function createCreateReportsReasoningEntry(
  state: CreateReportsState,
  toolCallId: string
): ChatMessageReasoningMessage | undefined {
  state.toolCallId = toolCallId;

  if (!state.file || !state.file.file_name) {
    return undefined;
  }

  // Build Record<string, ReasoningFile> as required by schema
  const filesRecord: Record<string, ChatMessageReasoningMessage_File> = {};
  const fileIds: string[] = [];

  // Type assertion to ensure proper typing
  const file = state.file as CreateReportStateFile;
  const id = file.id;
  fileIds.push(id);
  filesRecord[id] = {
    id,
    file_type: 'report_file',
    file_name: file.file_name ?? '',
    version_number: file.version_number,
    status: file.status,
    file: {
      text: file.file?.text || '',
    },
  };

  // Calculate title and status based on completion state
  let title = 'Creating report...';
  let status: 'loading' | 'completed' | 'failed' = 'loading';

  // Check if file has been processed (state has completion status)
  if (state.file.status === 'completed') {
    title = 'Created report_file';
    status = 'completed';
  } else if (state.file.status === 'failed') {
    title = 'Failed to create report_file';
    status = 'failed';
  }

  // Calculate elapsed time if complete
  const isComplete = state.file.status === 'completed' || state.file.status === 'failed';
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
 * Create a raw LLM message entry for create-reports tool
 */
export function createCreateReportsRawLlmMessageEntry(
  state: CreateReportsState,
  toolCallId: string
): ModelMessage | undefined {
  // If we don't have a file yet, skip emitting raw LLM entry
  if (!state.file) return undefined;

  const typedFile = state.file as CreateReportStateFile;

  // Only emit if we have valid name and content
  if (!typedFile.file_name || !typedFile.file?.text) {
    return undefined;
  }

  return {
    role: 'assistant',
    content: [
      {
        type: 'tool-call',
        toolCallId,
        toolName: CREATE_REPORTS_TOOL_NAME,
        input: {
          name: typedFile.file_name,
          content: typedFile.file.text,
        },
      },
    ],
  } as ModelMessage;
}
