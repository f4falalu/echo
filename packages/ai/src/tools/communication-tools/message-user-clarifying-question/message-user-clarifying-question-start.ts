import { updateMessageEntries } from '@buster/database';
import {
  messageUserClarifyingQuestionRawLlmMessageEntry,
  messageUserClarifyingQuestionResponseMessage,
} from './helpers/message-user-clarifying-question-transform-helper';
import type {
  MessageUserClarifyingQuestionContext,
  MessageUserClarifyingQuestionInput,
  MessageUserClarifyingQuestionState,
} from './message-user-clarifying-question';

// Factory function for onInputStart callback
export function createMessageUserClarifyingQuestionStart<
  TAgentContext extends MessageUserClarifyingQuestionContext = MessageUserClarifyingQuestionContext,
>(context: TAgentContext, state: MessageUserClarifyingQuestionState) {
  return async (input: MessageUserClarifyingQuestionInput) => {
    const messageId = context.messageId;

    console.info('[message-user-clarifying-question] Starting clarifying question', {
      messageId,
      questionLength: input.clarifying_question?.length || 0,
      timestamp: new Date().toISOString(),
    });

    // Initialize state
    state.processingStartTime = Date.now();
    state.toolCallId = `clarifying-question-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    state.clarifyingQuestion = input.clarifying_question;

    // If we have a messageId, create initial database entries
    if (messageId) {
      try {
        // Create initial response entry (empty, will be updated with streaming)
        const responseEntry = messageUserClarifyingQuestionResponseMessage(
          state.toolCallId,
          '' // Start with empty, will be populated during streaming
        );
        state.responseEntryId = responseEntry.id;

        // Create raw LLM message entry
        const rawLlmEntry = messageUserClarifyingQuestionRawLlmMessageEntry(
          state.toolCallId,
          'messageUserClarifyingQuestion',
          input
        );

        // Update database with initial entries (append mode)
        await updateMessageEntries(
          messageId,
          {
            responseEntry,
            rawLlmMessage: rawLlmEntry,
          },
          'append'
        );

        console.info('[message-user-clarifying-question] Created initial database entries', {
          messageId,
          toolCallId: state.toolCallId,
          responseEntryId: state.responseEntryId,
        });
      } catch (error) {
        console.error(
          '[message-user-clarifying-question] Failed to create initial database entries',
          {
            messageId,
            error: error instanceof Error ? error.message : 'Unknown error',
          }
        );
      }
    }
  };
}
