import { updateMessageEntries } from '@buster/database/queries';
import type { ToolCallOptions } from 'ai';
import type { CreateDashboardsContext, CreateDashboardsState } from './create-dashboards-tool';
import {
  createCreateDashboardsRawLlmMessageEntry,
  createCreateDashboardsReasoningEntry,
} from './helpers/create-dashboards-tool-transform-helper';

export function createDashboardsStart(
  context: CreateDashboardsContext,
  state: CreateDashboardsState
) {
  return async (options: ToolCallOptions) => {
    // Reset state for new tool call to prevent contamination from previous calls
    state.toolCallId = options.toolCallId;
    state.argsText = undefined;
    state.files = [];
    state.startTime = Date.now();

    if (context.messageId) {
      try {
        if (context.messageId && state.toolCallId) {
          // Update database with both reasoning and raw LLM entries
          try {
            const reasoningEntry = createCreateDashboardsReasoningEntry(state, options.toolCallId);
            const rawLlmMessage = createCreateDashboardsRawLlmMessageEntry(
              state,
              options.toolCallId
            );

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
            console.error('[create-dashboards] Error updating entries on finish:', error);
          }
        }
      } catch (error) {
        console.error('[create-dashboards] Error creating initial database entries:', error);
      }
    }
  };
}
