import { updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import type { CreateMetricsContext, CreateMetricsState } from './create-metrics-tool';
import {
  createCreateMetricsRawLlmMessageEntry,
  createCreateMetricsReasoningEntry,
} from './helpers/create-metrics-transform-helper';

export function createCreateMetricsStart(context: CreateMetricsContext, state: CreateMetricsState) {
  return async (options: ToolCallOptions) => {
    state.toolCallId = options.toolCallId;
    // Reset state for new tool call to prevent contamination from previous calls
    state.argsText = undefined;
    state.files = [];
    state.startTime = Date.now();

    if (context.messageId) {
      try {
        if (context.messageId && state.toolCallId) {
          // Update database with both reasoning and raw LLM entries
          try {
            const reasoningEntry = createCreateMetricsReasoningEntry(state, options.toolCallId);
            const rawLlmMessage = createCreateMetricsRawLlmMessageEntry(state, options.toolCallId);

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
            console.error('[create-metrics] Error updating entries on finish:', error);
          }
        }
      } catch (error) {
        console.error('[create-metrics] Error creating initial database entries:', error);
      }
    }
  };
}
