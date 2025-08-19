import { updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import type { DoneToolInput } from '../done-tool/done-tool';
import { messageUserClarifyingQuestionResponseMessage } from './helpers/message-user-clarifying-question-transform-helper';
import type {
  MessageUserClarifyingQuestionContext,
  MessageUserClarifyingQuestionInput,
  MessageUserClarifyingQuestionState,
} from './message-user-clarifying-question';

// Factory function for onInputAvailable callback
export function createMessageUserClarifyingQuestionFinish(
  context: MessageUserClarifyingQuestionContext,
  state: MessageUserClarifyingQuestionState
) {
  return async (options: { input: MessageUserClarifyingQuestionInput } & ToolCallOptions) => {
    const messageId = context.messageId;

    // Ensure state has complete input
    state.args = options.input.clarifying_question;
    state.clarifyingQuestion = options.input.clarifying_question;

    // If we have a messageId, finalize database entries
    if (messageId) {
      try {
        // Create final response entry with complete question
        const responseEntry = messageUserClarifyingQuestionResponseMessage(
          options.toolCallId,
          state
        );

        // Final update to database
        await updateMessageEntries({
          messageId,
          responseMessages: [responseEntry],
        });
      } catch (error) {
        console.error('[message-user-clarifying-question] Failed to finalize database entries', {
          messageId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  };
}
