import { updateMessageEntries } from '@buster/database';
import {
  OptimisticJsonParser,
  getOptimisticValue,
} from '../../../utils/streaming/optimistic-json-parser';
import {
  MESSAGE_USER_CLARIFYING_QUESTION_KEYS,
  extractClarifyingQuestion,
  messageUserClarifyingQuestionResponseMessage,
  updateClarifyingQuestionProgressMessage,
} from './helpers/message-user-clarifying-question-transform-helper';
import type {
  MessageUserClarifyingQuestionContext,
  MessageUserClarifyingQuestionInput,
  MessageUserClarifyingQuestionState,
} from './message-user-clarifying-question';

// Factory function for onInputDelta callback
export function createMessageUserClarifyingQuestionDelta<
  TAgentContext extends MessageUserClarifyingQuestionContext = MessageUserClarifyingQuestionContext,
>(context: TAgentContext, state: MessageUserClarifyingQuestionState) {
  return async (delta: string | Partial<MessageUserClarifyingQuestionInput>) => {
    const messageId = context.messageId;

    // Handle string deltas (streaming JSON)
    if (typeof delta === 'string') {
      state.argsText += delta;

      // Use optimistic parsing to extract values even from incomplete JSON
      const parseResult = OptimisticJsonParser.parse(state.argsText);

      // Update parsed args
      if (parseResult.parsed) {
        state.parsedArgs = parseResult.parsed as Partial<MessageUserClarifyingQuestionInput>;
      }

      // Extract clarifying question from optimistic parsing
      const clarifyingQuestion = extractClarifyingQuestion(parseResult.extractedValues);

      if (clarifyingQuestion) {
        state.clarifyingQuestion = clarifyingQuestion;

        // Update database with streaming progress if we have a messageId
        if (messageId && state.responseEntryId) {
          try {
            // Create updated response entry
            const responseEntry = messageUserClarifyingQuestionResponseMessage(
              state.toolCallId || '',
              clarifyingQuestion
            );

            // Get progress message
            const progressMessage = updateClarifyingQuestionProgressMessage(clarifyingQuestion);

            console.info(
              '[message-user-clarifying-question] Updating database with streaming progress',
              {
                messageId,
                progressMessage,
                questionWordCount: clarifyingQuestion.split(/\s+/).length,
              }
            );

            // Update database with update mode for streaming
            await updateMessageEntries(
              messageId,
              {
                responseEntry,
              },
              'update'
            );
          } catch (error) {
            console.error(
              '[message-user-clarifying-question] Failed to update streaming progress',
              {
                messageId,
                error: error instanceof Error ? error.message : 'Unknown error',
              }
            );
          }
        }
      }
    } else {
      // Handle object deltas (complete input)
      if (delta.clarifying_question) {
        state.parsedArgs = delta;
        state.clarifyingQuestion = delta.clarifying_question;

        // Update database with complete question
        if (messageId && state.responseEntryId) {
          try {
            const responseEntry = messageUserClarifyingQuestionResponseMessage(
              state.toolCallId || '',
              delta.clarifying_question
            );

            await updateMessageEntries(
              messageId,
              {
                responseEntry,
              },
              'update'
            );
          } catch (error) {
            console.error(
              '[message-user-clarifying-question] Failed to update with complete input',
              {
                messageId,
                error: error instanceof Error ? error.message : 'Unknown error',
              }
            );
          }
        }
      }
    }

    console.info('[message-user-clarifying-question] Input delta processed', {
      hasClarifyingQuestion: !!state.clarifyingQuestion,
      questionLength: state.clarifyingQuestion?.length || 0,
      messageId,
      timestamp: new Date().toISOString(),
    });
  };
}
