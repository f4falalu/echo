import type {
  ChatMessageReasoningMessage,
  ChatMessageResponseMessage,
} from '@buster/server-shared/chats';
import type { ModifyDashboardsInput } from '../modify-dashboards-tool';

/**
 * File structure for modify dashboards
 */
export interface ModifyDashboardsFile {
  id: string;
  name?: string;
  yml_content: string;
  status?: 'processing' | 'completed' | 'failed';
  version?: number;
  error?: string;
}

/**
 * Create a reasoning message entry for dashboards modification
 */
export function createDashboardsReasoningMessage(
  toolCallId: string,
  files: ModifyDashboardsFile[],
  status: 'loading' | 'completed' | 'failed' = 'loading'
): ChatMessageReasoningMessage {
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
    const fileId = file.id;
    fileIds.push(fileId);
    fileEntries[fileId] = {
      id: fileId,
      file_type: 'dashboard',
      file_name: file.name || `Dashboard ${fileId}`,
      version_number: file.version || undefined,
      status: file.status || 'loading',
      file: {
        text: file.yml_content,
      },
      ...(file.error && { error: file.error }),
    };
  });

  // Determine title based on status
  let title = 'Modifying dashboards...';
  if (status === 'completed') {
    const successCount = files.filter((f) => f.status !== 'failed').length;
    const failedCount = files.filter((f) => f.status === 'failed').length;
    if (failedCount > 0) {
      title = `Modified ${successCount} ${successCount === 1 ? 'dashboard' : 'dashboards'}, ${failedCount} failed`;
    } else {
      title = `Modified ${successCount} ${successCount === 1 ? 'dashboard' : 'dashboards'}`;
    }
  } else if (status === 'failed') {
    title = 'Failed to modify dashboards';
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
 * Create a response message for dashboards modification feedback
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
  args: Partial<ModifyDashboardsInput> | undefined
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
export function updateDashboardsProgressMessage(files: ModifyDashboardsFile[]): string {
  const processedCount = files.filter((f) => f.yml_content).length;
  const totalCount = files.length;

  if (processedCount === 0) {
    return 'Starting dashboard modification...';
  }
  if (processedCount < totalCount) {
    return `Processing dashboards... (${processedCount}/${totalCount})`;
  }
  return `Processed ${totalCount} ${totalCount === 1 ? 'dashboard' : 'dashboards'}`;
}

/**
 * Extract file info for final response
 */
export function extractDashboardsFileInfo(files: ModifyDashboardsFile[]) {
  const successfulFiles = files.filter((f) => f.status === 'completed');
  const failedFiles = files.filter((f) => f.status === 'failed');

  return {
    successfulFiles: successfulFiles.map((f) => ({
      id: f.id,
      name: f.name || `Dashboard ${f.id}`,
      version: f.version || 1,
    })),
    failedFiles: failedFiles.map((f) => ({
      id: f.id,
      name: f.name || `Dashboard ${f.id}`,
      error: f.error || 'Unknown error',
    })),
  };
}

/**
 * Keys for type-safe extraction from streaming JSON
 */
export const MODIFY_DASHBOARDS_KEYS = {
  files: 'files' as const,
  id: 'id' as const,
  yml_content: 'yml_content' as const,
} satisfies Record<string, keyof ModifyDashboardsInput | 'id' | 'yml_content'>;
