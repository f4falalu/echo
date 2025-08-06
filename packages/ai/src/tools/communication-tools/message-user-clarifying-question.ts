import { tool } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';

// Input/Output schemas
const messageUserClarifyingQuestionInputSchema = z.object({
  clarifying_question: z
    .string()
    .min(1, 'Clarifying question is required')
    .describe(
      "The clarifying question to ask the user. **MUST** be formatted in Markdown. Use bullet points or other appropriate Markdown formatting. Do not include headers. Do not use the '•' bullet character. Do not include markdown tables."
    ),
});

const messageUserClarifyingQuestionOutputSchema = z.object({});

// Process message user clarifying question tool execution
async function processMessageUserClarifyingQuestion(): Promise<
  z.infer<typeof messageUserClarifyingQuestionOutputSchema>
> {
  // This tool signals a clarifying question and pauses the workflow.
  // The actual agent termination logic resides elsewhere.
  return {};
}

// Main message user clarifying question function with tracing
const executeMessageUserClarifyingQuestion = wrapTraced(
  async (
    _clarifyingQuestion: string
  ): Promise<z.infer<typeof messageUserClarifyingQuestionOutputSchema>> => {
    return await processMessageUserClarifyingQuestion();
  },
  { name: 'message-user-clarifying-question' }
);

// Export the tool
export const messageUserClarifyingQuestion = tool({
  description:
    "Ask the user a clarifying question when additional information is needed to proceed with the analysis. Use this when partial analysis is possible but user confirmation is needed, or when the request is ambiguous. This must be in markdown format and not use the '•' bullet character.",
  inputSchema: messageUserClarifyingQuestionInputSchema,
  outputSchema: messageUserClarifyingQuestionOutputSchema,
  execute: async (input) => {
    return await executeMessageUserClarifyingQuestion(input.clarifying_question);
  },
});
