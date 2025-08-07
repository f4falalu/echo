import { tool } from 'ai';
import { z } from 'zod';
import { createDoneToolDelta } from './done-tool-delta';
import { createDoneToolExecute } from './done-tool-execute';
import { createDoneToolFinish } from './done-tool-finish';
import { createDoneToolStart } from './done-tool-start';

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

const DoneToolContextSchema = z.object({
  messageId: z.string().describe('The message ID of the message that triggered the done tool'),
});

export type DoneToolInput = z.infer<typeof DoneToolInputSchema>;
export type DoneToolOutput = z.infer<typeof DoneToolOutputSchema>;
export type DoneToolContext = z.infer<typeof DoneToolContextSchema>;

// Type constraint for agent context - must have at least a messageId
export type DoneToolAgentContext = { messageId?: string };

// Factory function that accepts agent context and maps to tool context
export function createDoneTool<TAgentContext extends DoneToolAgentContext = DoneToolAgentContext>() {
  // Create all functions with the specific agent context type
  const execute = createDoneToolExecute<TAgentContext>();
  const onInputStart = createDoneToolStart<TAgentContext>();
  const onInputDelta = createDoneToolDelta<TAgentContext>();
  const onInputAvailable = createDoneToolFinish<TAgentContext>();

  return tool({
    description:
      "Marks all remaining unfinished tasks as complete, sends a final response to the user, and ends the workflow. Use this when the workflow is finished. This must be in markdown format and not use the '•' bullet character.",
    inputSchema: DoneToolInputSchema,
    outputSchema: DoneToolOutputSchema,
    execute,
    onInputStart,
    onInputDelta,
    onInputAvailable,
  });
}

// Export a default instance for backward compatibility
export const doneTool = createDoneTool();
