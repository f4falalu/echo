import { updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import {
  createModifyReportsRawLlmMessageEntry,
  createModifyReportsReasoningEntry,
} from './helpers/modify-reports-transform-helper';
import type { ModifyReportsContext, ModifyReportsState } from './modify-reports-tool';

export function modifyReportsStart(context: ModifyReportsContext, state: ModifyReportsState) {
  return async (options: ToolCallOptions) => {
    state.toolCallId = options.toolCallId;
    state.startTime = Date.now();

    if (context.messageId) {
      try {
        if (context.messageId && state.toolCallId) {
          // Update database with both reasoning and raw LLM entries
          try {
            const reasoningEntry = createModifyReportsReasoningEntry(state, options.toolCallId);
            const rawLlmMessage = createModifyReportsRawLlmMessageEntry(state, options.toolCallId);

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
            console.error('[modify-reports] Error updating entries on start:', error);
          }
        }
      } catch (error) {
        console.error('[modify-reports] Error creating initial database entries:', error);
      }
    }
  };
}
