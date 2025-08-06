import { tool } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';

// Input/Output schemas
const respondWithoutAssetCreationInputSchema = z.object({
  final_response: z
    .string()
    .min(1, 'Final response is required')
    .describe(
      "The final response message to the user. **MUST** be formatted in Markdown. Use bullet points or other appropriate Markdown formatting. Do not include headers. Do not use the '•' bullet character. Do not include markdown tables."
    ),
});

const respondWithoutAssetCreationOutputSchema = z.object({});

// Process respond without asset creation tool execution
async function processRespondWithoutAssetCreation(): Promise<
  z.infer<typeof respondWithoutAssetCreationOutputSchema>
> {
  // This tool signals the end of the workflow and provides the final response.
  // The actual agent termination logic resides elsewhere.
  return {};
}

// Main respond without asset creation function with tracing
const executeRespondWithoutAssetCreation = wrapTraced(
  async (): Promise<z.infer<typeof respondWithoutAssetCreationOutputSchema>> => {
    return await processRespondWithoutAssetCreation();
  },
  { name: 'respond-without-asset-creation' }
);

// Export the tool
export const respondWithoutAssetCreation = tool({
  description:
    "Marks all remaining unfinished tasks as complete, sends a final response to the user, and ends the workflow. Use this when the workflow is finished. This must be in markdown format and not use the '•' bullet character.",
  inputSchema: respondWithoutAssetCreationInputSchema,
  outputSchema: respondWithoutAssetCreationOutputSchema,
  execute: async () => {
    return await executeRespondWithoutAssetCreation();
  },
});
