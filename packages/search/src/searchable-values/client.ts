import TurboPuffer from '@turbopuffer/turbopuffer';
import {
  type SearchQuery,
  SearchQuerySchema,
  type SearchResult,
  SearchResultSchema,
  type SearchableValue,
  SearchableValueSchema,
  type UpsertResult,
  UpsertResultSchema,
  NamespaceSchema,
} from './types';

/**
 * Custom error for Turbopuffer operations
 */
export class TurboPufferError extends Error {
  constructor(
    message: string,
    public override cause?: unknown
  ) {
    super(message);
    this.name = 'TurboPufferError';
  }
}

/**
 * Creates a namespace name from a data source ID
 */
export function createNamespace(dataSourceId: string): string {
  const namespace = `ds_${dataSourceId}`;
  NamespaceSchema.parse(namespace);
  return namespace;
}

/**
 * Initialize Turbopuffer client with API key from environment
 */
function getTurboPufferClient(): TurboPuffer {
  const apiKey = process.env.TURBOPUFFER_API_KEY;
  if (!apiKey) {
    throw new TurboPufferError('TURBOPUFFER_API_KEY environment variable is required');
  }
  
  return new TurboPuffer(apiKey);
}

/**
 * Query searchable values from Turbopuffer using vector similarity
 * 
 * @param dataSourceId - UUID of the data source
 * @param query - Search query parameters
 * @param queryEmbedding - Pre-computed embedding vector for the search query
 * @returns Promise containing search results ordered by similarity
 */
export async function querySearchableValues(
  dataSourceId: string,
  query: SearchQuery,
  queryEmbedding: number[]
): Promise<SearchResult[]> {
  try {
    // Validate inputs
    const validQuery = SearchQuerySchema.parse(query);
    
    if (queryEmbedding.length !== 1536) {
      throw new TurboPufferError('Query embedding must be 1536 dimensions');
    }

    const namespace = createNamespace(dataSourceId);
    const client = getTurboPufferClient();

    // Build filters for metadata
    const filters: Record<string, unknown> = {};
    if (validQuery.databaseName) {
      filters.databaseName = validQuery.databaseName;
    }
    if (validQuery.tableName) {
      filters.tableName = validQuery.tableName;
    }
    if (validQuery.columnName) {
      filters.columnName = validQuery.columnName;
    }

    // Query Turbopuffer
    const response = await client.query({
      namespace,
      vector: queryEmbedding,
      topK: validQuery.limit,
      filters,
      // Include similarity threshold if specified
      ...(validQuery.similarityThreshold && { 
        threshold: validQuery.similarityThreshold 
      }),
    });

    // Transform response to SearchResult format
    const results: SearchResult[] = response.map((item) => {
      const result = {
        id: item.id,
        value: item.attributes.value as string,
        databaseName: item.attributes.databaseName as string,
        tableName: item.attributes.tableName as string,
        columnName: item.attributes.columnName as string,
        schemaName: item.attributes.schemaName as string | undefined,
        syncedAt: new Date(item.attributes.syncedAt as string),
        similarity: item.dist, // Turbopuffer returns similarity as 'dist'
      };

      return SearchResultSchema.parse(result);
    });

    return results;
  } catch (error) {
    if (error instanceof TurboPufferError) {
      throw error;
    }
    throw new TurboPufferError(
      `Failed to query searchable values: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error
    );
  }
}

/**
 * Upsert searchable values to Turbopuffer with embeddings
 * 
 * @param dataSourceId - UUID of the data source  
 * @param values - Array of searchable values with embeddings
 * @returns Promise containing upsert result
 */
export async function upsertSearchableValues(
  dataSourceId: string,
  values: SearchableValue[]
): Promise<UpsertResult> {
  try {
    // Validate inputs
    const validValues = values.map((value) => SearchableValueSchema.parse(value));
    
    if (validValues.length === 0) {
      return UpsertResultSchema.parse({
        success: true,
        upsertedCount: 0,
      });
    }

    // Ensure all values have embeddings
    const valuesWithoutEmbeddings = validValues.filter((v) => !v.embedding);
    if (valuesWithoutEmbeddings.length > 0) {
      throw new TurboPufferError('All values must have embeddings before upserting');
    }

    const namespace = createNamespace(dataSourceId);
    const client = getTurboPufferClient();

    // Transform to Turbopuffer format
    const turboPufferData = validValues.map((value) => ({
      id: value.id,
      vector: value.embedding!, // We validated embeddings exist above
      attributes: {
        value: value.value,
        databaseName: value.databaseName,
        tableName: value.tableName,
        columnName: value.columnName,
        schemaName: value.schemaName,
        syncedAt: value.syncedAt.toISOString(),
      },
    }));

    // Upsert to Turbopuffer
    await client.upsert({
      namespace,
      data: turboPufferData,
    });

    return UpsertResultSchema.parse({
      success: true,
      upsertedCount: validValues.length,
    });
  } catch (error) {
    if (error instanceof TurboPufferError) {
      throw error;
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return UpsertResultSchema.parse({
      success: false,
      upsertedCount: 0,
      error: `Failed to upsert searchable values: ${errorMessage}`,
    });
  }
}

/**
 * Get all searchable values for a data source (for deduplication)
 * 
 * @param dataSourceId - UUID of the data source
 * @returns Promise containing all existing searchable values
 */
export async function getAllSearchableValues(
  dataSourceId: string
): Promise<SearchableValue[]> {
  try {
    const namespace = createNamespace(dataSourceId);
    const client = getTurboPufferClient();

    // Query all vectors in the namespace
    // Note: This might need pagination for large datasets
    const response = await client.query({
      namespace,
      vector: new Array(1536).fill(0), // Dummy vector
      topK: 10000, // Large number to get all values
      threshold: 0, // Include all similarities
    });

    // Transform response to SearchableValue format
    const values: SearchableValue[] = response.map((item) => {
      const value = {
        id: item.id,
        value: item.attributes.value as string,
        databaseName: item.attributes.databaseName as string,
        tableName: item.attributes.tableName as string,
        columnName: item.attributes.columnName as string,
        schemaName: item.attributes.schemaName as string | undefined,
        syncedAt: new Date(item.attributes.syncedAt as string),
        embedding: item.vector,
      };

      return SearchableValueSchema.parse(value);
    });

    return values;
  } catch (error) {
    throw new TurboPufferError(
      `Failed to get existing searchable values: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error
    );
  }
}

/**
 * Delete searchable values from Turbopuffer
 * 
 * @param dataSourceId - UUID of the data source
 * @param valueIds - Array of value IDs to delete
 * @returns Promise that resolves when deletion is complete
 */
export async function deleteSearchableValues(
  dataSourceId: string,
  valueIds: string[]
): Promise<void> {
  try {
    if (valueIds.length === 0) {
      return;
    }

    const namespace = createNamespace(dataSourceId);
    const client = getTurboPufferClient();

    await client.delete({
      namespace,
      ids: valueIds,
    });
  } catch (error) {
    throw new TurboPufferError(
      `Failed to delete searchable values: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error
    );
  }
}