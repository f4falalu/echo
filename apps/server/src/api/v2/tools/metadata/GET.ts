import { getDatasetMetadata } from '@buster/database/queries';
import type { GetMetadataRequest, GetMetadataResponse } from '@buster/server-shared';
import type { ApiKeyContext } from '@buster/server-shared';
import { HTTPException } from 'hono/http-exception';

/**
 * Handler for retrieving dataset metadata via API key authentication
 *
 * This handler:
 * 1. Validates API key has access to the organization
 * 2. Queries for dataset matching database, schema, name, and organization
 * 3. Returns the dataset's metadata column
 *
 * @param request - The metadata request containing database, schema, and name
 * @param apiKeyContext - The authenticated API key context
 * @returns The dataset metadata
 */
export async function getMetadataHandler(
  request: GetMetadataRequest,
  apiKeyContext: ApiKeyContext
): Promise<GetMetadataResponse> {
  const { organizationId } = apiKeyContext;

  // Get dataset metadata
  const result = await getDatasetMetadata({
    database: request.database,
    schema: request.schema,
    name: request.name,
    organizationId,
  });

  if (!result || !result.metadata) {
    throw new HTTPException(404, {
      message: `Dataset not found: ${request.database}.${request.schema}.${request.name}`,
    });
  }

  return {
    metadata: result.metadata,
  };
}
