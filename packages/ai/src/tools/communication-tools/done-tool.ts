import { tool } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';

const DoneToolInputSchema = z.object({
  final_response: z
    .string()
    .min(1, 'Final response is required')
    .describe(
      "The final response message to the user. **MUST** be formatted in Markdown. Use bullet points or other appropriate Markdown formatting. Do not include headers. Do not use the '•' bullet character. Do not include markdown tables."
    ),
});

const DoneToolOutputSchema = z.object({
  success: z.boolean().describe('Whether the operation was successful'),
});

type DoneToolInput = z.infer<typeof DoneToolInputSchema>;
type DoneToolOutput = z.infer<typeof DoneToolOutputSchema>;

// Process done tool execution with todo management
async function processDone(_input: DoneToolInput): Promise<DoneToolOutput> {
  return {
    success: true,
  };
}

// Main done function with tracing
const executeDone = wrapTraced(
  async (input: DoneToolInput): Promise<DoneToolOutput> => {
    return await processDone(input);
  },
  { name: 'Done Tool' }
);

// Export the tool
export const doneTool = tool({
  description:
    "Marks all remaining unfinished tasks as complete, sends a final response to the user, and ends the workflow. Use this when the workflow is finished. This must be in markdown format and not use the '•' bullet character.",
  inputSchema: DoneToolInputSchema,
  outputSchema: DoneToolOutputSchema,
  execute: async (input) => {
    return await executeDone(input);
  },
  onInputDelta: ({ inputTextDelta, toolCallId }) => {
    console.info('Tool input delta for', toolCallId, ':', inputTextDelta);
  },
});
