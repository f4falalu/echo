import { wrapTraced } from 'braintrust';
import type {
  RespondWithoutAssetCreationContext,
  RespondWithoutAssetCreationInput,
  RespondWithoutAssetCreationOutput,
} from './respond-without-asset-creation-tool';

// Process respond without asset creation tool execution
async function processRespondWithoutAssetCreation(
  input: RespondWithoutAssetCreationInput,
  context: RespondWithoutAssetCreationContext
): Promise<RespondWithoutAssetCreationOutput> {
  // This tool signals the end of the workflow and provides the final response.
  // The actual agent termination logic resides elsewhere.
  // The streaming handlers (start, delta, finish) handle database updates.

  console.info('[respond-without-asset-creation] Executing with message:', {
    messageId: context.messageId,
    responseLength: input.final_response?.length || 0,
  });

  return {};
}

// Factory function that creates the execute function with the specific agent context
export function createRespondWithoutAssetCreationExecute<
  TAgentContext extends RespondWithoutAssetCreationContext,
>(context: TAgentContext) {
  return wrapTraced(
    async (input: RespondWithoutAssetCreationInput): Promise<RespondWithoutAssetCreationOutput> => {
      return await processRespondWithoutAssetCreation(input, context);
    },
    { name: 'respond-without-asset-creation' }
  );
}
