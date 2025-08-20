import { updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import {
  createModifyReportsRawLlmMessageEntry,
  createModifyReportsReasoningEntry,
} from './helpers/modify-reports-transform-helper';
import type { ModifyReportsContext, ModifyReportsState } from './modify-reports-tool';

export function modifyReportsStart(context: ModifyReportsContext, state: ModifyReportsState) {
  return async (options: ToolCallOptions) => {
    // Reset state for new tool call to prevent contamination from previous calls
    state.toolCallId = options.toolCallId;
    state.argsText = undefined;
    state.reportId = undefined;
    state.reportName = undefined;
    state.edits = [];
    state.currentContent = undefined;
    state.finalContent = undefined;
    state.version_number = undefined;
    state.startTime = Date.now();
    state.responseMessageCreated = false;
    state.snapshotContent = undefined;
    state.streamingEdits = [];

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
            console.error('[modify-reports] Error updating entries on start:', error);
          }
        }
      } catch (error) {
        console.error('[modify-reports] Error creating initial database entries:', error);
      }
    }
  };
}
