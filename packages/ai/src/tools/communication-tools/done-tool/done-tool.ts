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

const DoneToolStateSchema = z.object({
  entry_id: z
    .string()
    .optional()
    .describe(
      'The entry ID of the entry that triggered the done tool. This is optional and will be set by the tool start'
    ),
  args: z.string().optional().describe('The arguments of the done tool'),
  final_response: z
    .string()
    .optional()
    .describe(
      'The final response message to the user. This is optional and will be set by the tool delta and finish'
    ),
});

export type DoneToolInput = z.infer<typeof DoneToolInputSchema>;
export type DoneToolOutput = z.infer<typeof DoneToolOutputSchema>;
export type DoneToolContext = z.infer<typeof DoneToolContextSchema>;
export type DoneToolState = z.infer<typeof DoneToolStateSchema>;

export function createDoneTool<TAgentContext extends DoneToolContext = DoneToolContext>(
  context: TAgentContext
) {
  const state: DoneToolState = {
    entry_id: undefined,
    args: undefined,
    final_response: undefined,
  };

  const execute = createDoneToolExecute<TAgentContext>(context);
  const onInputStart = createDoneToolStart<TAgentContext>(state, context);
  const onInputDelta = createDoneToolDelta<TAgentContext>(state, context);
  const onInputAvailable = createDoneToolFinish<TAgentContext>(state, context);

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

// Default instance requires a context to be passed
// export const doneTool = createDoneTool();
