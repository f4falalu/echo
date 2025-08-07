import type {
  ChatMessageReasoningMessage,
  ChatMessageResponseMessage,
} from '@buster/server-shared/chats';
import type { ModifyMetricsFile, ModifyMetricsInput } from '../modify-metrics-tool';

/**
 * Create a reasoning message entry for metrics modification
 */
export function createModifyMetricsReasoningMessage(
  toolCallId: string,
  files: ModifyMetricsFile[],
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
      file_type: 'metric',
      file_name: file.name || `Metric ${fileId}`,
      version_number: file.version || undefined,
      status: file.status || 'loading',
      file: {
        text: file.yml_content,
      },
      ...(file.error && { error: file.error }),
    };
  });

  // Determine title based on status
  let title = 'Modifying metrics...';
  if (status === 'completed') {
    const successCount = files.filter((f) => f.status !== 'failed').length;
    const failedCount = files.filter((f) => f.status === 'failed').length;
    if (failedCount > 0) {
      title = `Modified ${successCount} ${successCount === 1 ? 'metric' : 'metrics'}, ${failedCount} failed`;
    } else {
      title = `Modified ${successCount} ${successCount === 1 ? 'metric' : 'metrics'}`;
    }
  } else if (status === 'failed') {
    title = 'Failed to modify metrics';
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
 * Create a response message for metrics modification feedback
 */
export function createModifyMetricsResponseMessage(
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
export function createModifyMetricsRawLlmMessageEntry(
  toolCallId: string,
  toolName: string,
  args: Partial<ModifyMetricsInput> | undefined
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
export function updateModifyMetricsProgressMessage(files: ModifyMetricsFile[]): string {
  const processedCount = files.filter((f) => f.yml_content).length;
  const totalCount = files.length;

  if (processedCount === 0) {
    return 'Starting metric modification...';
  }
  if (processedCount < totalCount) {
    return `Processing metrics... (${processedCount}/${totalCount})`;
  }
  return `Processed ${totalCount} ${totalCount === 1 ? 'metric' : 'metrics'}`;
}

/**
 * Extract file info for final response
 */
export function extractModifyMetricsFileInfo(files: ModifyMetricsFile[]) {
  const successfulFiles = files.filter((f) => f.status === 'completed' && f.id);
  const failedFiles = files.filter((f) => f.status === 'failed');

  return {
    successfulFiles: successfulFiles.map((f) => ({
      id: f.id,
      name: f.name || `Metric ${f.id}`,
      version: f.version || 1,
    })),
    failedFiles: failedFiles.map((f) => ({
      id: f.id,
      name: f.name || `Metric ${f.id}`,
      error: f.error || 'Unknown error',
    })),
  };
}

/**
 * Keys for type-safe extraction from streaming JSON
 */
export const MODIFY_METRICS_KEYS = {
  files: 'files' as const,
  id: 'id' as const,
  yml_content: 'yml_content' as const,
  name: 'name' as const,
} satisfies Record<string, keyof ModifyMetricsInput | 'id' | 'yml_content' | 'name'>;
