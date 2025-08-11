import { updateMessageEntries } from '@buster/database';
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
    state.toolCallId = options.toolCallId;
    state.argsText = '';
    state.files = [];

    if (context.messageId) {
      try {
        // Initially we don't have files yet, so reasoning entry might be undefined
        const reasoningEntry = createCreateDashboardsReasoningEntry(state, options.toolCallId);
        const rawLlmMessage = createCreateDashboardsRawLlmMessageEntry(state, options.toolCallId);

        // Only update if we have something to update
        if (reasoningEntry) {
          await updateMessageEntries({
            messageId: context.messageId,
            responseEntry: reasoningEntry,
            mode: 'append',
          });
        }

        if (rawLlmMessage) {
          await updateMessageEntries({
            messageId: context.messageId,
            rawLlmMessageEntry: rawLlmMessage,
            mode: 'append',
          });
        }
      } catch (error) {
        console.error('[create-dashboards] Error creating initial database entries:', error);
      }
    }
  };
}
