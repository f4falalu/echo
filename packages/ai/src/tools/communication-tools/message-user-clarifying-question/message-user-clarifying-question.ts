import { tool } from 'ai';
import { z } from 'zod';
import { createMessageUserClarifyingQuestionDelta } from './message-user-clarifying-question-delta';
import { createMessageUserClarifyingQuestionExecute } from './message-user-clarifying-question-execute';
import { createMessageUserClarifyingQuestionFinish } from './message-user-clarifying-question-finish';
import { createMessageUserClarifyingQuestionStart } from './message-user-clarifying-question-start';

export const MESSAGE_USER_CLARIFYING_QUESTION_TOOL_NAME = 'messageUserClarifyingQuestion';

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

const MessageUserClarifyingQuestionContextSchema = z.object({
  messageId: z.string().describe('The message ID of the message that triggered the tool'),
  chatId: z.string().describe('The chat ID of the chat that triggered the tool'),
  userId: z.string().describe('The user ID of the user that triggered the tool'),
});

const MessageUserClarifyingQuestionStateSchema = z.object({
  toolCallId: z
    .string()
    .optional()
    .describe('The tool call ID of the tool call that triggered the tool'),
  args: z.string().optional().describe('The arguments of the tool'),
  clarifyingQuestion: z.string().optional().describe('The clarifying question of the tool'),
});

// Export types
export type MessageUserClarifyingQuestionInput = z.infer<
  typeof MessageUserClarifyingQuestionInputSchema
>;
export type MessageUserClarifyingQuestionOutput = z.infer<
  typeof MessageUserClarifyingQuestionOutputSchema
>;
export type MessageUserClarifyingQuestionContext = z.infer<
  typeof MessageUserClarifyingQuestionContextSchema
>;
export type MessageUserClarifyingQuestionState = z.infer<
  typeof MessageUserClarifyingQuestionStateSchema
>;

// Factory function that accepts agent context and creates the tool
export function createMessageUserClarifyingQuestionTool<
  TAgentContext extends MessageUserClarifyingQuestionContext = MessageUserClarifyingQuestionContext,
>(context: TAgentContext) {
  // Initialize state for streaming
  const state: MessageUserClarifyingQuestionState = {
    toolCallId: undefined,
    args: '',
    clarifyingQuestion: '',
  };

  // Create all functions with the context and state passed
  const execute = createMessageUserClarifyingQuestionExecute();
  const onInputStart = createMessageUserClarifyingQuestionStart(context, state);
  const onInputDelta = createMessageUserClarifyingQuestionDelta(context, state);
  const onInputAvailable = createMessageUserClarifyingQuestionFinish(context, state);

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
