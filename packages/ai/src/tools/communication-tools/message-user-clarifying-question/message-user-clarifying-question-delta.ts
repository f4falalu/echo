import { updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import {
  OptimisticJsonParser,
  getOptimisticValue,
} from '../../../utils/streaming/optimistic-json-parser';
import { messageUserClarifyingQuestionResponseMessage } from './helpers/message-user-clarifying-question-transform-helper';
import type {
  MessageUserClarifyingQuestionContext,
  MessageUserClarifyingQuestionInput,
  MessageUserClarifyingQuestionState,
} from './message-user-clarifying-question';

// Type-safe key extraction from the input schema - ensures compile-time safety if field name changes
const CLARIFYING_QUESTION_KEY =
  'clarifying_question' as const satisfies keyof MessageUserClarifyingQuestionInput;

// Factory function for onInputDelta callback
export function createMessageUserClarifyingQuestionDelta(
  context: MessageUserClarifyingQuestionContext,
  state: MessageUserClarifyingQuestionState
) {
  return async function messageUserClarifyingQuestionDelta(
    options: { inputTextDelta: string } & ToolCallOptions
  ): Promise<void> {
    // Accumulate the delta into args to maintain a running buffer
    state.args = (state.args || '') + options.inputTextDelta;

    // Parse optimistically to extract the clarifying question even from incomplete JSON
    const parseResult = OptimisticJsonParser.parse(state.args);

    const clarifyingQuestion = getOptimisticValue<string>(
      parseResult.extractedValues,
      CLARIFYING_QUESTION_KEY
    );

    if (clarifyingQuestion !== undefined && clarifyingQuestion !== '') {
      // Update in-memory state
      state.clarifyingQuestion = clarifyingQuestion;

      // Persist streaming progress if we have required identifiers
      const messageId = context.messageId;
      const toolCallId = options.toolCallId ?? state.toolCallId;

      if (messageId && toolCallId) {
        try {
          const responseEntry = messageUserClarifyingQuestionResponseMessage(toolCallId, state);

          await updateMessageEntries({
            messageId,
            responseEntry,
            mode: 'update',
          });
        } catch (error) {
          console.error(
            '[message-user-clarifying-question] Failed to update streaming progress:',
            error
          );
        }
      }
    }
  };
}
