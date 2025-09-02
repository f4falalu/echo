import { z } from 'zod';

/**
 * Schema for a searchable value that will be stored in Turbopuffer
 */
export const SearchableValueSchema = z.object({
  id: z.string().uuid(),
  value: z.string(),
  databaseName: z.string(),
  tableName: z.string(), 
  columnName: z.string(),
  schemaName: z.string().optional(),
  syncedAt: z.date(),
  embedding: z.array(z.number()).length(1536).optional(), // OpenAI text-embedding-3-small
});

export type SearchableValue = z.infer<typeof SearchableValueSchema>;

/**
 * Schema for search query parameters
 */
export const SearchQuerySchema = z.object({
  query: z.string().min(1),
  limit: z.number().int().positive().max(100).default(10),
  similarityThreshold: z.number().min(0).max(1).optional(),
  databaseName: z.string().optional(),
  tableName: z.string().optional(),
  columnName: z.string().optional(),
});

export type SearchQuery = z.infer<typeof SearchQuerySchema>;

/**
 * Schema for search results
 */
export const SearchResultSchema = z.object({
  id: z.string().uuid(),
  value: z.string(),
  databaseName: z.string(),
  tableName: z.string(),
  columnName: z.string(),
  schemaName: z.string().optional(),
  syncedAt: z.date(),
  similarity: z.number().min(0).max(1),
});

export type SearchResult = z.infer<typeof SearchResultSchema>;

/**
 * Schema for upsert operations
 */
export const UpsertResultSchema = z.object({
  success: z.boolean(),
  upsertedCount: z.number().int().nonnegative(),
  error: z.string().optional(),
});

export type UpsertResult = z.infer<typeof UpsertResultSchema>;

/**
 * Schema for namespace validation (based on data source ID)
 */
export const NamespaceSchema = z.string().regex(
  /^ds_[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/,
  'Namespace must be in format: ds_<uuid>'
);

/**
 * Schema for deduplication input
 */
export const DeduplicationInputSchema = z.object({
  existingValues: z.array(SearchableValueSchema),
  newValues: z.array(SearchableValueSchema),
});

export type DeduplicationInput = z.infer<typeof DeduplicationInputSchema>;

/**
 * Schema for deduplication result
 */
export const DeduplicationResultSchema = z.object({
  toUpsert: z.array(SearchableValueSchema),
  toSkip: z.array(SearchableValueSchema),
  duplicateCount: z.number().int().nonnegative(),
});

export type DeduplicationResult = z.infer<typeof DeduplicationResultSchema>;