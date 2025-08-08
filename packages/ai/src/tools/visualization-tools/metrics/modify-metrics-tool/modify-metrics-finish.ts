import { updateMessageFields } from '@buster/database';
import {
  createModifyMetricsRawLlmMessageEntry,
  createModifyMetricsReasoningMessage,
} from './helpers/modify-metrics-tool-transform-helper';
import type {
  ModifyMetricsAgentContext,
  ModifyMetricsInput,
  ModifyMetricsState,
} from './modify-metrics-tool';

export function createModifyMetricsFinish<
  TAgentContext extends ModifyMetricsAgentContext = ModifyMetricsAgentContext,
>(context: TAgentContext, state: ModifyMetricsState) {
  return async (input: ModifyMetricsInput) => {
    const fileCount = input.files?.length || 0;
    const messageId = context?.messageId;
    const fileIds = input.files?.map((f) => f.id) || [];

    // Store complete input in state
    state.parsedArgs = input;

    // Update state files with final data
    state.files = input.files.map((file) => ({
      id: file.id,
      yml_content: file.yml_content,
      name: undefined, // Name will be populated from backend response
      status: 'processing' as const,
    }));

    console.info('[modify-metrics] Input fully available', {
      fileCount,
      fileIds,
      messageId,
      timestamp: new Date().toISOString(),
    });

    // Update database with final state if we have both messageId and reasoningEntryId
    if (messageId && state.reasoningEntryId) {
      try {
        // Create final reasoning entry
        const reasoningEntry = createModifyMetricsReasoningMessage(
          state.toolCallId || `modify-metrics-${Date.now()}`,
          state.files,
          'loading' // Still loading until execution completes
        );

        // Create raw LLM message entry with full args
        const rawLlmEntry = createModifyMetricsRawLlmMessageEntry(
          state.toolCallId || `modify-metrics-${Date.now()}`,
          'modify-metrics-file',
          state.parsedArgs
        );

        console.info('[modify-metrics] Updating database with final input', {
          messageId,
          fileCount,
          toolCallId: state.toolCallId,
        });

        await updateMessageFields(messageId, {
          reasoning: [reasoningEntry],
          rawLlmMessages: [rawLlmEntry],
        });
      } catch (error) {
        console.error('[modify-metrics] Failed to update database with final input', {
          messageId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        // Continue processing even if database update fails
      }
    }

    // Log processing time if available
    if (state.processingStartTime) {
      const processingTime = Date.now() - state.processingStartTime;
      console.info('[modify-metrics] Input processing time', {
        processingTimeMs: processingTime,
        processingTimeSeconds: (processingTime / 1000).toFixed(2),
      });
    }
  };
}
