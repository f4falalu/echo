import type { ChatMessageReasoningMessage } from '@buster/server-shared/chats';
import type { ModelMessage } from 'ai';
import type { CreateDashboardsState } from '../create-dashboards-tool';

/**
 * Create a reasoning entry for create-dashboards tool
 */
export function createCreateDashboardsReasoningEntry(
  state: CreateDashboardsState,
  toolCallId: string
): ChatMessageReasoningMessage | undefined {
  if (!state.files || state.files.length === 0) {
    return undefined;
  }

  // Transform files to the format expected by reasoning messages
  interface FileEntry {
    id: string;
    file_type: string;
    file_name: string;
    version_number?: number;
    status: string;
    file: {
      text: string;
    };
    error?: string;
  }
  const fileEntries: Record<string, FileEntry> = {};
  const fileIds: string[] = [];

  state.files.forEach((file) => {
    const fileId = file.id || `dashboard-${toolCallId}-${file.name}`;
    fileIds.push(fileId);
    fileEntries[fileId] = {
      id: fileId,
      file_type: 'dashboard',
      file_name: file.name,
      status: file.status || 'processing',
      file: {
        text: file.yml_content,
      },
      ...(file.version !== undefined ? { version_number: file.version } : {}),
      ...(file.error && { error: file.error }),
    };
  });

  // Determine status and title based on file states
  let title = 'Creating dashboards';
  let status: 'loading' | 'completed' | 'failed' = 'loading';

  const processingCount = state.files.filter((f) => f.status === 'processing').length;
  const completedCount = state.files.filter((f) => f.status === 'completed').length;
  const failedCount = state.files.filter((f) => f.status === 'failed').length;

  if (processingCount > 0) {
    title = `Creating ${state.files.length} ${state.files.length === 1 ? 'dashboard' : 'dashboards'}`;
    status = 'loading';
  } else if (failedCount === state.files.length) {
    title = 'Failed to create dashboards';
    status = 'failed';
  } else if (completedCount > 0 || failedCount > 0) {
    if (failedCount > 0) {
      title = `Created ${completedCount} ${completedCount === 1 ? 'dashboard' : 'dashboards'}, ${failedCount} failed`;
      status = 'failed';
    } else {
      title = `Created ${completedCount} ${completedCount === 1 ? 'dashboard' : 'dashboards'}`;
      status = 'completed';
    }
  }

  return {
    id: toolCallId,
    type: 'files',
    title,
    status,
    file_ids: fileIds,
    files: fileEntries,
  } as ChatMessageReasoningMessage;
}

/**
 * Create a raw LLM message entry for create-dashboards tool
 */
export function createCreateDashboardsRawLlmMessageEntry(
  state: CreateDashboardsState,
  toolCallId: string
): ModelMessage | undefined {
  if (!state.parsedArgs || !state.parsedArgs.files || state.parsedArgs.files.length === 0) {
    return undefined;
  }

  return {
    role: 'assistant',
    content: [
      {
        type: 'tool-call',
        toolCallId,
        toolName: 'createDashboards',
        input: {
          files: state.parsedArgs.files,
        },
      },
    ],
  } as ModelMessage;
}
