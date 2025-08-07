import { wrapTraced } from 'braintrust';
import type {
  MessageUserClarifyingQuestionContext,
  MessageUserClarifyingQuestionInput,
  MessageUserClarifyingQuestionOutput,
  MessageUserClarifyingQuestionState,
} from './message-user-clarifying-question';

// Process message user clarifying question tool execution
async function processMessageUserClarifyingQuestion(): Promise<MessageUserClarifyingQuestionOutput> {
  // This tool signals a clarifying question and pauses the workflow.
  // The actual agent termination logic resides elsewhere.
  return {};
}

// Factory function for execute callback
export function createMessageUserClarifyingQuestionExecute<
  TAgentContext extends MessageUserClarifyingQuestionContext = MessageUserClarifyingQuestionContext,
>(context: TAgentContext, _state: MessageUserClarifyingQuestionState) {
  // Wrap the execution with tracing
  const executeMessageUserClarifyingQuestion = wrapTraced(
    async (
      input: MessageUserClarifyingQuestionInput
    ): Promise<MessageUserClarifyingQuestionOutput> => {
      console.info('[message-user-clarifying-question] Executing clarifying question', {
        messageId: context.messageId,
        questionLength: input.clarifying_question?.length || 0,
        timestamp: new Date().toISOString(),
      });

      // Process the clarifying question
      const result = await processMessageUserClarifyingQuestion();

      console.info('[message-user-clarifying-question] Clarifying question execution complete', {
        messageId: context.messageId,
        timestamp: new Date().toISOString(),
      });

      return result;
    },
    { name: 'message-user-clarifying-question-execute' }
  );

  // Return the execute function
  return async (
    input: MessageUserClarifyingQuestionInput
  ): Promise<MessageUserClarifyingQuestionOutput> => {
    return await executeMessageUserClarifyingQuestion(input);
  };
}
