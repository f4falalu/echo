import { wrapTraced } from 'braintrust';
import type {
  MessageUserClarifyingQuestionContext,
  MessageUserClarifyingQuestionInput,
  MessageUserClarifyingQuestionOutput,
  MessageUserClarifyingQuestionState,
} from './message-user-clarifying-question';

// Process message user clarifying question tool execution
async function processMessageUserClarifyingQuestion(): Promise<MessageUserClarifyingQuestionOutput> {
  return {};
}

// Factory function for execute callback
export function createMessageUserClarifyingQuestionExecute() {
  // Wrap the execution with tracing
  const executeMessageUserClarifyingQuestion = wrapTraced(
    async (
      _input: MessageUserClarifyingQuestionInput
    ): Promise<MessageUserClarifyingQuestionOutput> => {
      return processMessageUserClarifyingQuestion();
    },
    { name: 'Message User Clarifying Question' }
  );

  // Return the execute function
  return async (
    input: MessageUserClarifyingQuestionInput
  ): Promise<MessageUserClarifyingQuestionOutput> => {
    return await executeMessageUserClarifyingQuestion(input);
  };
}
