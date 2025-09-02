/**
 * @buster/search package
 * Provides searchable values functionality using Turbopuffer and DuckDB
 */

// Export all searchable-values functionality
export * from './searchable-values';

// Note: Client and deduplication exports will be added once implementations are complete
// These exports are commented out until the implementations match the new schema

// export {
//   querySearchableValues,
//   upsertSearchableValues,
//   getAllSearchableValues,
//   deleteSearchableValues,
//   createNamespace,
//   TurboPufferError,
// } from './searchable-values/client';

// export {
//   deduplicateValues,
//   deduplicateValuesSimple,
//   DeduplicationError,
// } from './searchable-values/deduplicate';