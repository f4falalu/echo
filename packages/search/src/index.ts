// Export Turbopuffer client operations
export {
  querySearchableValues,
  upsertSearchableValues,
  getAllSearchableValues,
  deleteSearchableValues,
  createNamespace,
  TurboPufferError,
} from './searchable-values/client';

// Export deduplication functions
export {
  deduplicateValues,
  deduplicateValuesSimple,
  DeduplicationError,
} from './searchable-values/deduplicate';

// Export types and schemas
export {
  type SearchableValue,
  SearchableValueSchema,
  type SearchQuery,
  SearchQuerySchema,
  type SearchResult,
  SearchResultSchema,
  type UpsertResult,
  UpsertResultSchema,
  type DeduplicationInput,
  DeduplicationInputSchema,
  type DeduplicationResult,
  DeduplicationResultSchema,
  NamespaceSchema,
} from './searchable-values/types';