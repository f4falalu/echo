import { updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import type { CreateReportsContext, CreateReportsState } from './create-reports-tool';
import {
  createCreateReportsRawLlmMessageEntry,
  createCreateReportsReasoningEntry,
} from './helpers/create-reports-tool-transform-helper';

export function createReportsStart(context: CreateReportsContext, state: CreateReportsState) {
  return async (options: ToolCallOptions) => {
    state.toolCallId = options.toolCallId;

    if (context.messageId) {
      try {
        if (context.messageId && state.toolCallId) {
          // Update database with both reasoning and raw LLM entries
          try {
            const reasoningEntry = createCreateReportsReasoningEntry(state, options.toolCallId);
            const rawLlmMessage = createCreateReportsRawLlmMessageEntry(state, options.toolCallId);

            // Update both entries together if they exist
            const updates: Parameters<typeof updateMessageEntries>[0] = {
              messageId: context.messageId,
              mode: 'append',
            };

            if (reasoningEntry) {
              updates.responseEntry = reasoningEntry;
            }

            if (rawLlmMessage) {
              updates.rawLlmMessage = rawLlmMessage;
            }

            if (reasoningEntry || rawLlmMessage) {
              await updateMessageEntries(updates);
            }
          } catch (error) {
            console.error('[create-reports] Error updating entries on finish:', error);
          }
        }
      } catch (error) {
        console.error('[create-reports] Error creating initial database entries:', error);
      }
    }
  };
}
