import { tool } from 'ai';
import { z } from 'zod';
import { createMessageUserClarifyingQuestionDelta } from './message-user-clarifying-question-delta';
import { createMessageUserClarifyingQuestionExecute } from './message-user-clarifying-question-execute';
import { createMessageUserClarifyingQuestionFinish } from './message-user-clarifying-question-finish';
import { createMessageUserClarifyingQuestionStart } from './message-user-clarifying-question-start';

// Input/Output schemas
const MessageUserClarifyingQuestionInputSchema = z.object({
  clarifying_question: z
    .string()
    .min(1, 'Clarifying question is required')
    .describe(
      "The clarifying question to ask the user. **MUST** be formatted in Markdown. Use bullet points or other appropriate Markdown formatting. Do not include headers. Do not use the '•' bullet character. Do not include markdown tables."
    ),
});

const MessageUserClarifyingQuestionOutputSchema = z.object({});

// Export types
export type MessageUserClarifyingQuestionInput = z.infer<
  typeof MessageUserClarifyingQuestionInputSchema
>;
export type MessageUserClarifyingQuestionOutput = z.infer<
  typeof MessageUserClarifyingQuestionOutputSchema
>;

// State management for streaming
export interface MessageUserClarifyingQuestionState {
  toolCallId?: string;
  argsText: string;
  parsedArgs?: Partial<MessageUserClarifyingQuestionInput>;
  clarifyingQuestion: string;
  processingStartTime?: number;
  messageId?: string | undefined;
  responseEntryId?: string;
}

// Type constraint for agent context - must have required fields
export type MessageUserClarifyingQuestionContext = {
  messageId?: string | undefined;
  chatId?: string;
  userId?: string;
};

// Factory function that accepts agent context and creates the tool
export function createMessageUserClarifyingQuestionTool<
  TAgentContext extends MessageUserClarifyingQuestionContext = MessageUserClarifyingQuestionContext,
>(context: TAgentContext) {
  // Initialize state for streaming
  const state: MessageUserClarifyingQuestionState = {
    argsText: '',
    clarifyingQuestion: '',
    messageId: context.messageId,
  };

  // Create all functions with the context and state passed
  const execute = createMessageUserClarifyingQuestionExecute<TAgentContext>(context, state);
  const onInputStart = createMessageUserClarifyingQuestionStart<TAgentContext>(context, state);
  const onInputDelta = createMessageUserClarifyingQuestionDelta<TAgentContext>(context, state);
  const onInputAvailable = createMessageUserClarifyingQuestionFinish<TAgentContext>(context, state);

  // Return the tool definition
  return tool({
    description:
      "Ask the user a clarifying question when additional information is needed to proceed with the analysis. Use this when partial analysis is possible but user confirmation is needed, or when the request is ambiguous. This must be in markdown format and not use the '•' bullet character.",
    inputSchema: MessageUserClarifyingQuestionInputSchema,
    outputSchema: MessageUserClarifyingQuestionOutputSchema,
    execute,
    onInputStart,
    onInputDelta,
    onInputAvailable,
  });
}

// Export a standalone version for backward compatibility
export const messageUserClarifyingQuestion = createMessageUserClarifyingQuestionTool({});
