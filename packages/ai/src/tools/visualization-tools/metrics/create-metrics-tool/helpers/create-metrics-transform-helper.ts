import type {
  ChatMessageReasoningMessage,
  ChatMessageResponseMessage,
} from '@buster/server-shared/chats';
import type {
  CreateMetricsFile,
  CreateMetricsInput,
  CreateMetricsState,
} from '../create-metrics-tool';

/**
 * Create a reasoning message entry for metrics creation
 */
export function createMetricsReasoningMessage(
  toolCallId: string,
  state: CreateMetricsState
): ChatMessageReasoningMessage {
  const files = state.files || [];
}

/**
 * Create a response message for metrics creation feedback
 */
export function createMetricsResponseMessage(
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
export function createMetricsRawLlmMessageEntry(
  toolCallId: string,
  toolName: string,
  args: Partial<CreateMetricsInput> | undefined
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
export function updateMetricsProgressMessage(files: CreateMetricsFile[]): string {
  const processedCount = files.filter((f) => f.yml_content).length;
  const totalCount = files.length;

  if (processedCount === 0) {
    return 'Starting metric creation...';
  }
  if (processedCount < totalCount) {
    return `Processing metrics... (${processedCount}/${totalCount})`;
  }
  return `Processed ${totalCount} ${totalCount === 1 ? 'metric' : 'metrics'}`;
}

/**
 * Extract file info for final response
 */
export function extractMetricsFileInfo(files: CreateMetricsFile[]) {
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
export const CREATE_METRICS_KEYS = {
  files: 'files' as const,
  name: 'name' as const,
  yml_content: 'yml_content' as const,
} satisfies Record<string, keyof CreateMetricsInput | 'name' | 'yml_content'>;
