import { wrapTraced } from 'braintrust';
import type {
  RespondWithoutAssetCreationContext,
  RespondWithoutAssetCreationInput,
  RespondWithoutAssetCreationOutput,
} from './respond-without-asset-creation-tool';

async function processRespondWithoutAssetCreation(): Promise<RespondWithoutAssetCreationOutput> {
  return {};
}

export function createRespondWithoutAssetCreationExecute() {
  return wrapTraced(
    async (
      _input: RespondWithoutAssetCreationInput
    ): Promise<RespondWithoutAssetCreationOutput> => {
      return await processRespondWithoutAssetCreation();
    },
    { name: 'Respond Without Asset Creation' }
  );
}
