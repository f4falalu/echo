import { updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import {
  createModifyMetricsRawLlmMessageEntry,
  createModifyMetricsReasoningEntry,
} from './helpers/modify-metrics-tool-transform-helper';
import type { ModifyMetricsContext, ModifyMetricsState } from './modify-metrics-tool';

export function createModifyMetricsStart(context: ModifyMetricsContext, state: ModifyMetricsState) {
  return async (options: ToolCallOptions) => {
    state.toolCallId = options.toolCallId;
    state.startTime = Date.now();

    if (context.messageId) {
      try {
        if (context.messageId && state.toolCallId) {
          // Update database with both reasoning and raw LLM entries
          try {
            const reasoningEntry = createModifyMetricsReasoningEntry(state, options.toolCallId);
            const rawLlmMessage = createModifyMetricsRawLlmMessageEntry(state, options.toolCallId);

            // Update both entries together if they exist
            const updates: Parameters<typeof updateMessageEntries>[0] = {
              messageId: context.messageId,
            };

            if (reasoningEntry) {
              updates.reasoningMessages = [reasoningEntry];
            }

            if (rawLlmMessage) {
              updates.rawLlmMessages = [rawLlmMessage];
            }

            if (reasoningEntry || rawLlmMessage) {
              await updateMessageEntries(updates);
            }
          } catch (error) {
            console.error('[modify-metrics] Error updating entries on start:', error);
          }
        }
      } catch (error) {
        console.error('[modify-metrics] Error creating initial database entries:', error);
      }
    }
  };
}
