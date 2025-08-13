import { tool } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';

export const SUBMIT_THOUGHTS_TOOL_NAME = 'submitThoughts';

// Minimal schemas: no input/output for a signal-only tool
const SubmitThoughtsInputSchema = z.object({});
const SubmitThoughtsOutputSchema = z.object({});

// Optional context for consistency with other tools (e.g., messageId for future logging)
const SubmitThoughtsContextSchema = z.object({
  messageId: z.string().optional().describe('The message ID for tracking tool execution.'),
});

export type SubmitThoughtsInput = z.infer<typeof SubmitThoughtsInputSchema>;
export type SubmitThoughtsOutput = z.infer<typeof SubmitThoughtsOutputSchema>;
export type SubmitThoughtsContext = z.infer<typeof SubmitThoughtsContextSchema>;

async function processSubmitThoughts(): Promise<SubmitThoughtsOutput> {
  return {};
}

function createSubmitThoughtsExecute() {
  return wrapTraced(
    async (): Promise<SubmitThoughtsOutput> => {
      return await processSubmitThoughts();
    },
    { name: 'Submit Thoughts' }
  );
}

// Factory: returns a simple tool definition (no streaming lifecycle needed)
export function createSubmitThoughtsTool() {
  const execute = createSubmitThoughtsExecute();

  return tool({
    description:
      'Confirms that the agent has finished thinking through all of its steps and is ready to move on to the next phase of the workflow. This is a signal tool with no input or output parameters.',
    inputSchema: SubmitThoughtsInputSchema,
    outputSchema: SubmitThoughtsOutputSchema,
    execute,
  });
}
