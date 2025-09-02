/**
 * Searchable values module exports
 * Provides types, schemas, and utilities for managing searchable text values
 */

// Export all types and schemas
export {
  // Core schemas
  SearchableValueSchema,
  TurbopufferQuerySchema,
  DeduplicationResultSchema,
  TurbopufferDocumentSchema,
  UpsertResultSchema,
  // Sync job schemas
  SyncJobPayloadSchema,
  SyncJobStatusSchema,
  SyncJobMetadataSchema,
  // Configuration schemas
  BatchConfigSchema,
  // Search schemas
  SearchRequestSchema,
  SearchResultSchema,
  SearchResponseSchema,
  // Error handling schemas
  ErrorTypeSchema,
  SyncErrorSchema,
  // Types
  type SearchableValue,
  type TurbopufferQuery,
  type DeduplicationResult,
  type TurbopufferDocument,
  type UpsertResult,
  type SyncJobPayload,
  type SyncJobStatus,
  type SyncJobMetadata,
  type BatchConfig,
  type SearchRequest,
  type SearchResult,
  type SearchResponse,
  type ErrorType,
  type SyncError,
  // Utility functions
  createUniqueKey,
  parseUniqueKey,
  generateNamespace,
  isValidForEmbedding,
} from './types';

// Export client functionality with composable functions
export {
  // Core functions
  queryExistingKeys,
  upsertSearchableValues,
  createNamespaceIfNotExists,
  deleteSearchableValues,
  getAllSearchableValues,
  searchSimilarValues,
  checkNamespaceExists,
  // Pure utility functions
  isRetryableError,
  calculateBackoffDelay,
  buildFilter,
  valuesToColumns,
  chunk,
  // Higher-order functions
  withRetry,
  // Client factory functions
  createClient,
  getNamespace,
  // Error class
  TurbopufferError,
  // Types
  type RetryOptions,
} from './client';

// Note: Deduplication exports will be added after implementation
// export * from './deduplicate';
