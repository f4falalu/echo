import { updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import {
  createModifyDashboardsRawLlmMessageEntry,
  createModifyDashboardsReasoningEntry,
} from './helpers/modify-dashboards-transform-helper';
import type { ModifyDashboardsContext, ModifyDashboardsState } from './modify-dashboards-tool';

export function createModifyDashboardsStart(
  context: ModifyDashboardsContext,
  state: ModifyDashboardsState
) {
  return async (options: ToolCallOptions) => {
    state.toolCallId = options.toolCallId;
    state.startTime = Date.now();
    state.startTime = Date.now();

    if (context.messageId) {
      try {
        if (context.messageId && state.toolCallId) {
          // Update database with both reasoning and raw LLM entries
          try {
            const reasoningEntry = createModifyDashboardsReasoningEntry(state, options.toolCallId);
            const rawLlmMessage = createModifyDashboardsRawLlmMessageEntry(
              state,
              options.toolCallId
            );

            // Update both entries together if they exist
            const updates: Parameters<typeof updateMessageEntries>[0] = {
              messageId: context.messageId,
              toolCallId: options.toolCallId,
            };

            if (reasoningEntry) {
              updates.reasoningEntry = reasoningEntry;
            }

            if (rawLlmMessage) {
              updates.rawLlmMessage = rawLlmMessage;
            }

            if (reasoningEntry || rawLlmMessage) {
              await updateMessageEntries(updates);
            }
          } catch (error) {
            console.error('[modify-dashboards] Error updating entries on finish:', error);
          }
        }
      } catch (error) {
        console.error('[modify-dashboards] Error creating initial database entries:', error);
      }
    }
  };
}
