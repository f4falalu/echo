import { updateMessageEntries } from '@buster/database';
import { messageUserClarifyingQuestionResponseMessage } from './helpers/message-user-clarifying-question-transform-helper';
import type {
  MessageUserClarifyingQuestionContext,
  MessageUserClarifyingQuestionInput,
  MessageUserClarifyingQuestionState,
} from './message-user-clarifying-question';

// Factory function for onInputAvailable callback
export function createMessageUserClarifyingQuestionFinish<
  TAgentContext extends MessageUserClarifyingQuestionContext = MessageUserClarifyingQuestionContext,
>(context: TAgentContext, state: MessageUserClarifyingQuestionState) {
  return async (input: MessageUserClarifyingQuestionInput) => {
    const messageId = context.messageId;
    const processingTime = Date.now() - (state.processingStartTime || Date.now());

    console.info('[message-user-clarifying-question] Finalizing clarifying question', {
      messageId,
      processingTime,
      questionLength: input.clarifying_question?.length || 0,
      timestamp: new Date().toISOString(),
    });

    // Ensure state has complete input
    state.parsedArgs = input;
    state.clarifyingQuestion = input.clarifying_question;

    // If we have a messageId, finalize database entries
    if (messageId && state.responseEntryId) {
      try {
        // Create final response entry with complete question
        const responseEntry = messageUserClarifyingQuestionResponseMessage(
          state.toolCallId || '',
          input.clarifying_question
        );

        // Final update to database
        await updateMessageEntries(
          messageId,
          {
            responseEntry,
          },
          'update'
        );

        console.info('[message-user-clarifying-question] Finalized database entries', {
          messageId,
          toolCallId: state.toolCallId,
          responseEntryId: state.responseEntryId,
          finalQuestionLength: input.clarifying_question.length,
        });
      } catch (error) {
        console.error('[message-user-clarifying-question] Failed to finalize database entries', {
          messageId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    console.info('[message-user-clarifying-question] Clarifying question ready', {
      messageId,
      processingTime,
      questionWordCount: input.clarifying_question.split(/\s+/).length,
    });
  };
}
