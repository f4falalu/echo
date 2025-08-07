// Re-export the factory function for new usage pattern
export { createRespondWithoutAssetCreationTool } from './respond-without-asset-creation/respond-without-asset-creation-tool';

// For backward compatibility, create a default instance that doesn't require context
// This uses an empty messageId, which means streaming won't update the database
// but the tool will still function for basic usage
import { createRespondWithoutAssetCreationTool } from './respond-without-asset-creation/respond-without-asset-creation-tool';

// Create a default instance without messageId for backward compatibility
// When messageId is undefined, the tool will skip database updates but still work
export const respondWithoutAssetCreation = createRespondWithoutAssetCreationTool({});
