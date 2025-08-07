import { createMessageFields, updateMessageFields } from '@buster/database';
import {
  createModifyMetricsRawLlmMessageEntry,
  createModifyMetricsReasoningMessage,
} from './helpers/modify-metrics-tool-transform-helper';
import type {
  ModifyMetricsAgentContext,
  ModifyMetricsInput,
  ModifyMetricsState,
} from './modify-metrics-tool';

export function createModifyMetricsStart<
  TAgentContext extends ModifyMetricsAgentContext = ModifyMetricsAgentContext,
>(context: TAgentContext, state: ModifyMetricsState) {
  return async (_input: ModifyMetricsInput) => {
    const fileCount = _input.files?.length || 0;
    const messageId = context?.messageId;

    // Initialize state
    state.processingStartTime = Date.now();
    state.toolCallId = `modify-metrics-${Date.now()}-${Math.random().toString(36).substr(2, 11)}`;

    console.info('[modify-metrics] Starting metric modification', {
      fileCount,
      messageId,
      toolCallId: state.toolCallId,
      timestamp: new Date().toISOString(),
    });

    // Create initial database entries ONLY if messageId exists
    if (messageId) {
      try {
        // Create initial reasoning entry
        const reasoningEntry = createModifyMetricsReasoningMessage(
          state.toolCallId,
          [], // No files yet
          'loading'
        );

        // Create raw LLM message entry
        const rawLlmEntry = createModifyMetricsRawLlmMessageEntry(
          state.toolCallId,
          'modify-metrics-file',
          undefined // No args yet
        );

        console.info('[modify-metrics] Creating initial database entries', {
          messageId,
          toolCallId: state.toolCallId,
          reasoningEntryId: reasoningEntry.id,
        });

        // Update database with initial entries
        await updateMessageFields(messageId, {
          reasoning: [reasoningEntry],
          rawLlmMessages: [rawLlmEntry],
        });

        // Store reasoning entry ID in state for later updates
        state.reasoningEntryId = reasoningEntry.id;
      } catch (error) {
        console.error('[modify-metrics] Failed to create initial database entries', {
          messageId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        // Continue processing even if database update fails
      }
    }
  };
}
