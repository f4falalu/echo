import { tool } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';

// Input/Output schemas
const IdleInputSchema = z.object({
  final_response: z
    .string()
    .min(1, 'Final response is required')
    .describe(
      "The final response message to the user. **MUST** be formatted in Markdown. Use bullet points or other appropriate Markdown formatting. Do not include headers. Do not use the '•' bullet character. Do not include markdown tables."
    ),
});

const IdleOutputSchema = z.object({
  success: z.boolean().describe('Whether the operation was successful'),
});

type IdleOutput = z.infer<typeof IdleOutputSchema>;

async function processIdle(): Promise<IdleOutput> {
  return {
    success: true,
  };
}

const executeIdle = wrapTraced(
  async (): Promise<IdleOutput> => {
    return await processIdle();
  },
  { name: 'idle-tool' }
);

// Export the tool
export const idleTool = tool({
  description:
    "Marks all remaining unfinished tasks as complete, sends a final response to the user, and enters an idle state. Use this when current work is finished but the agent should remain available for future tasks. This must be in markdown format and not use the '•' bullet character.",
  inputSchema: IdleInputSchema,
  outputSchema: IdleOutputSchema,
  execute: executeIdle,
});

export default idleTool;
