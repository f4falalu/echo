import type {
  ChatMessageReasoningMessage_Files,
  ChatMessageResponseMessage,
} from '@buster/server-shared/chats';
import type { CreateDashboardsFile, CreateDashboardsInput } from '../create-dashboards-tool';

/**
 * Create a reasoning message entry for dashboards creation
 */
export function createDashboardsReasoningMessage(
  toolCallId: string,
  files: CreateDashboardsFile[],
  status: 'loading' | 'completed' | 'failed' = 'loading'
): ChatMessageReasoningMessage_Files {
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

  files.forEach((file) => {
    const fileId = file.id || crypto.randomUUID();
    fileIds.push(fileId);
    fileEntries[fileId] = {
      id: fileId,
      file_type: 'dashboard',
      file_name: file.name,
      status: file.status || 'loading',
      file: {
        text: file.yml_content,
      },
      ...(file.version !== undefined ? { version_number: file.version } : {}),
      ...(file.error && { error: file.error }),
    };
  });

  // Determine title based on status
  let title = 'Building new dashboards...';
  if (status === 'completed') {
    const successCount = files.filter((f) => f.status !== 'failed').length;
    const failedCount = files.filter((f) => f.status === 'failed').length;
    if (failedCount > 0) {
      title = `Created ${successCount} ${successCount === 1 ? 'dashboard' : 'dashboards'}, ${failedCount} failed`;
    } else {
      title = `Created ${successCount} ${successCount === 1 ? 'dashboard' : 'dashboards'}`;
    }
  } else if (status === 'failed') {
    title = 'Failed to create dashboards';
  }

  return {
    id: toolCallId,
    type: 'files',
    title,
    status,
    file_ids: fileIds,
    files: fileEntries,
  } as ChatMessageReasoningMessage_Files;
}

/**
 * Create a response message for dashboards creation feedback
 */
export function createDashboardsResponseMessage(
  toolCallId: string,
  message: string
): ChatMessageResponseMessage {
  return {
    id: toolCallId,
    type: 'text',
    message,
    is_final_message: false,
  } as ChatMessageResponseMessage;
}

/**
 * Create raw LLM message entry for database
 */
export function createDashboardsRawLlmMessageEntry(
  toolCallId: string,
  toolName: string,
  args: Partial<CreateDashboardsInput> | undefined
) {
  return {
    type: 'tool-call',
    toolCallId,
    toolName,
    args: args || {},
  };
}

/**
 * Update progress message during streaming
 */
export function updateDashboardsProgressMessage(files: CreateDashboardsFile[]): string {
  const processedCount = files.filter((f) => f.yml_content).length;
  const totalCount = files.length;

  if (processedCount === 0) {
    return 'Starting dashboard creation...';
  }
  if (processedCount < totalCount) {
    return `Processing dashboards... (${processedCount}/${totalCount})`;
  }
  return `Processed ${totalCount} ${totalCount === 1 ? 'dashboard' : 'dashboards'}`;
}

/**
 * Extract file info for final response
 */
export function extractDashboardsFileInfo(files: CreateDashboardsFile[]) {
  const successfulFiles = files.filter((f) => f.status === 'completed' && f.id);
  const failedFiles = files.filter((f) => f.status === 'failed');

  return {
    successfulFiles: successfulFiles.map((f) => ({
      id: f.id || '',
      name: f.name,
      version: f.version || 1,
    })),
    failedFiles: failedFiles.map((f) => ({
      name: f.name,
      error: f.error || 'Unknown error',
    })),
  };
}

/**
 * Keys for type-safe extraction from streaming JSON
 */
export const TOOL_KEYS = {
  files: 'files' as const,
  name: 'name' as const,
  yml_content: 'yml_content' as const,
} satisfies Record<string, keyof CreateDashboardsInput | 'name' | 'yml_content'>;
