import { tool } from 'ai';
import { z } from 'zod';
import { createRespondWithoutAssetCreationDelta } from './respond-without-asset-creation-delta';
import { createRespondWithoutAssetCreationExecute } from './respond-without-asset-creation-execute';
import { createRespondWithoutAssetCreationFinish } from './respond-without-asset-creation-finish';
import { createRespondWithoutAssetCreationStart } from './respond-without-asset-creation-start';

export const RespondWithoutAssetCreationInputSchema = z.object({
  final_response: z
    .string()
    .min(1, 'Final response is required')
    .describe(
      "The final response message to the user. **MUST** be formatted in Markdown. Use bullet points or other appropriate Markdown formatting. Do not include headers. Do not use the '•' bullet character. Do not include markdown tables."
    ),
});

export const RespondWithoutAssetCreationOutputSchema = z.object({});

const RespondWithoutAssetCreationContextSchema = z.object({
  messageId: z
    .string()
    .optional()
    .describe(
      'The message ID of the message that triggered the respond without asset creation tool'
    ),
});

const RespondWithoutAssetCreationStateSchema = z.object({
  entry_id: z
    .string()
    .optional()
    .describe(
      'The entry ID of the entry that triggered the tool. This is optional and will be set by the tool start'
    ),
  args: z.string().optional().describe('The arguments of the tool'),
  final_response: z
    .string()
    .optional()
    .describe(
      'The final response message to the user. This is optional and will be set by the tool delta and finish'
    ),
});

export type RespondWithoutAssetCreationInput = z.infer<
  typeof RespondWithoutAssetCreationInputSchema
>;
export type RespondWithoutAssetCreationOutput = z.infer<
  typeof RespondWithoutAssetCreationOutputSchema
>;
export type RespondWithoutAssetCreationContext = z.infer<
  typeof RespondWithoutAssetCreationContextSchema
>;
export type RespondWithoutAssetCreationState = z.infer<
  typeof RespondWithoutAssetCreationStateSchema
>;

export function createRespondWithoutAssetCreationTool<
  TAgentContext extends RespondWithoutAssetCreationContext = RespondWithoutAssetCreationContext,
>(context: TAgentContext) {
  const state: RespondWithoutAssetCreationState = {
    entry_id: undefined,
    args: undefined,
    final_response: undefined,
  };

  const execute = createRespondWithoutAssetCreationExecute();
  const onInputStart = createRespondWithoutAssetCreationStart(state, context);
  const onInputDelta = createRespondWithoutAssetCreationDelta(state, context);
  const onInputAvailable = createRespondWithoutAssetCreationFinish(state, context);

  return tool({
    description:
      "Marks all remaining unfinished tasks as complete, sends a final response to the user, and ends the workflow. Use this when the workflow is finished. This must be in markdown format and not use the '•' bullet character.",
    inputSchema: RespondWithoutAssetCreationInputSchema,
    outputSchema: RespondWithoutAssetCreationOutputSchema,
    execute,
    onInputStart,
    onInputDelta,
    onInputAvailable,
  });
}
