import { tool } from 'ai';
import { z } from 'zod';
import { createRespondWithoutAssetCreationDelta } from './respond-without-asset-creation-delta';
import { createRespondWithoutAssetCreationExecute } from './respond-without-asset-creation-execute';
import { createRespondWithoutAssetCreationFinish } from './respond-without-asset-creation-finish';
import { createRespondWithoutAssetCreationStart } from './respond-without-asset-creation-start';

export const RESPOND_WITHOUT_ASSET_CREATION_TOOL_NAME = 'respondWithoutAssetCreation';

export const RespondWithoutAssetCreationInputSchema = z.object({
  final_response: z
    .string()
    .min(1, 'Final response is required')
    .describe(
      "The final response message to the user. **MUST** be formatted in Markdown. Use bullet points or other appropriate Markdown formatting. Do not include headers. Do not use the '•' bullet character. Do not include markdown tables."
    ),
});

export const RespondWithoutAssetCreationOutputSchema = z.object({
  success: z.boolean().describe('Whether the operation was successful'),
});

const RespondWithoutAssetCreationContextSchema = z.object({
  messageId: z
    .string()
    .describe(
      'The message ID of the message that triggered the respond without asset creation tool'
    ),
  workflowStartTime: z.number().describe('The start time of the workflow'),
});

const RespondWithoutAssetCreationStateSchema = z.object({
  toolCallId: z
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

export function createRespondWithoutAssetCreationTool(context: RespondWithoutAssetCreationContext) {
  const state: RespondWithoutAssetCreationState = {
    toolCallId: undefined,
    args: undefined,
    final_response: undefined,
  };

  const execute = createRespondWithoutAssetCreationExecute(context, state);
  const onInputStart = createRespondWithoutAssetCreationStart(context, state);
  const onInputDelta = createRespondWithoutAssetCreationDelta(context, state);
  const onInputAvailable = createRespondWithoutAssetCreationFinish(context, state);

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
