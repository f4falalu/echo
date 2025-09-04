import { z } from 'zod';

/**
 * Core searchable value data structure
 * Represents a single searchable text value from a customer database
 */
export const SearchableValueSchema = z.object({
  database: z.string().min(1),
  schema: z.string().min(1),
  table: z.string().min(1),
  column: z.string().min(1),
  value: z.string().min(1),
  embedding: z.array(z.number()).length(1536).optional(),
  synced_at: z.string().datetime().optional(),
});

export type SearchableValue = z.infer<typeof SearchableValueSchema>;

/**
 * Query parameters for filtering Turbopuffer searches
 * All fields are optional to allow flexible filtering
 */
export const TurbopufferQuerySchema = z.object({
  dataSourceId: z.string().uuid(),
  database: z.string().optional(),
  schema: z.string().optional(),
  table: z.string().optional(),
  column: z.string().optional(),
});

export type TurbopufferQuery = z.infer<typeof TurbopufferQuerySchema>;

/**
 * Result from the deduplication process
 * Contains new values that need embeddings and counts
 */
export const DeduplicationResultSchema = z.object({
  newValues: z.array(SearchableValueSchema),
  existingCount: z.number().int().min(0),
  newCount: z.number().int().min(0),
});

export type DeduplicationResult = z.infer<typeof DeduplicationResultSchema>;

/**
 * Turbopuffer document structure
 * Stores searchable values with their metadata and embeddings
 */
export const TurbopufferDocumentSchema = z.object({
  id: z.string(),
  vector: z.array(z.number()).length(1536),
  attributes: z.object({
    database: z.string(),
    schema: z.string(),
    table: z.string(),
    column: z.string(),
    value: z.string(),
    synced_at: z.string(),
  }),
});

export type TurbopufferDocument = z.infer<typeof TurbopufferDocumentSchema>;

/**
 * Result from Turbopuffer upsert operations
 */
export const UpsertResultSchema = z.object({
  namespace: z.string(),
  upserted: z.number().int().min(0),
  errors: z.array(z.string()).optional(),
});

export type UpsertResult = z.infer<typeof UpsertResultSchema>;

/**
 * Sync job payload for Trigger.dev
 */
export const SyncJobPayloadSchema = z.object({
  dataSourceId: z.string().uuid(),
  syncType: z.enum(['daily', 'manual', 'initial']),
  database: z.string().optional(),
  schema: z.string().optional(),
  table: z.string().optional(),
  column: z.string().optional(),
});

export type SyncJobPayload = z.infer<typeof SyncJobPayloadSchema>;

/**
 * Sync job status tracking
 */
export const SyncJobStatusSchema = z.enum(['pending', 'running', 'completed', 'failed']);

export type SyncJobStatus = z.infer<typeof SyncJobStatusSchema>;

/**
 * Sync job metadata for tracking progress and errors
 */
export const SyncJobMetadataSchema = z.object({
  processedCount: z.number().int().min(0).optional(),
  existingCount: z.number().int().min(0).optional(),
  error: z.string().optional(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  duration: z.number().optional(), // in milliseconds
});

export type SyncJobMetadata = z.infer<typeof SyncJobMetadataSchema>;

/**
 * Configuration for batch processing
 */
export const BatchConfigSchema = z.object({
  batchSize: z.number().int().min(1).max(1000).default(100),
  maxRetries: z.number().int().min(0).max(10).default(3),
  rateLimitDelay: z.number().int().min(0).default(1000), // milliseconds
});

export type BatchConfig = z.infer<typeof BatchConfigSchema>;

/**
 * Search request schema for finding similar values
 */
export const SearchRequestSchema = z.object({
  dataSourceId: z.string().uuid(),
  query: z.string().min(1),
  limit: z.number().int().min(1).max(100).default(10),
  filters: z
    .object({
      database: z.string().optional(),
      schema: z.string().optional(),
      table: z.string().optional(),
      column: z.string().optional(),
    })
    .optional(),
  similarityThreshold: z.number().min(0).max(1).optional(),
});

export type SearchRequest = z.infer<typeof SearchRequestSchema>;

/**
 * Search result with similarity score
 */
export const SearchResultSchema = z.object({
  value: z.string(),
  database: z.string(),
  schema: z.string(),
  table: z.string(),
  column: z.string(),
  similarity: z.number().min(0).max(1),
  synced_at: z.string().datetime(),
});

export type SearchResult = z.infer<typeof SearchResultSchema>;

/**
 * Response from search operation
 */
export const SearchResponseSchema = z.object({
  results: z.array(SearchResultSchema),
  totalCount: z.number().int().min(0),
  query: z.string(),
  processingTime: z.number(), // milliseconds
});

export type SearchResponse = z.infer<typeof SearchResponseSchema>;

/**
 * Error types for better error handling
 */
export const ErrorTypeSchema = z.enum([
  'TURBOPUFFER_API_ERROR',
  'DUCKDB_ERROR',
  'EMBEDDING_ERROR',
  'NETWORK_ERROR',
  'VALIDATION_ERROR',
  'RATE_LIMIT_ERROR',
  'UNKNOWN_ERROR',
]);

export type ErrorType = z.infer<typeof ErrorTypeSchema>;

/**
 * Structured error for sync operations
 */
export const SyncErrorSchema = z.object({
  type: ErrorTypeSchema,
  message: z.string(),
  details: z.record(z.unknown()).optional(),
  retryable: z.boolean().default(false),
  timestamp: z.string().datetime(),
});

export type SyncError = z.infer<typeof SyncErrorSchema>;

/**
 * Create a unique key for deduplication
 * Format: "${database}:${schema}:${table}:${column}:${value}"
 */
export function createUniqueKey(
  value: SearchableValue | Omit<SearchableValue, 'embedding' | 'synced_at'>
): string {
  return `${value.database}:${value.schema}:${value.table}:${value.column}:${value.value}`;
}

/**
 * Parse a unique key back into its components
 */
export function parseUniqueKey(key: string): Omit<SearchableValue, 'embedding' | 'synced_at'> {
  const parts = key.split(':');
  if (parts.length < 5) {
    throw new Error(`Invalid unique key format: ${key}`);
  }

  // Handle case where value contains colons
  const [database, schema, table, column, ...valueParts] = parts;

  if (!database || !schema || !table || !column) {
    throw new Error(`Invalid unique key format: ${key}`);
  }

  const value = valueParts.join(':');

  return { database, schema, table, column, value };
}

/**
 * Generate namespace for Turbopuffer based on data source ID
 */
export function generateNamespace(dataSourceId: string): string {
  return dataSourceId;
}

/**
 * Validate that a value is suitable for embedding
 * Returns true if the value should be embedded
 */
export function isValidForEmbedding(value: string): boolean {
  // Skip empty or whitespace-only values
  if (!value.trim()) return false;

  // Skip values that are too short (less than 3 characters)
  if (value.trim().length < 3) return false;

  // Skip values that are too long (more than 8000 characters)
  if (value.length > 8000) return false;

  // Skip values that appear to be IDs (UUIDs, numeric IDs, etc.)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const numericIdRegex = /^\d+$/;
  if (uuidRegex.test(value) || numericIdRegex.test(value)) return false;

  return true;
}
