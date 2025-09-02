/**
 * Sync Jobs Query Helpers
 *
 * Functions for managing searchable values sync jobs
 * Used by the searchable-values sync system to track and manage
 * synchronization of text values to Turbopuffer
 */

// ============================================================================
// DATA SOURCE QUERIES
// ============================================================================
export {
  // Functions
  getDataSourcesForSync,
  dataSourceNeedsSync,
  // Types
  type DataSourceForSync,
  type GetDataSourcesForSyncOutput,
  // Schemas
  DataSourceForSyncSchema,
  GetDataSourcesForSyncOutputSchema,
} from './get-data-sources-for-sync';

// ============================================================================
// SYNC JOB CREATION
// ============================================================================
export {
  // Functions
  createSearchableValuesSyncJob,
  batchCreateSyncJobs,
  upsertSyncJob,
  // Types
  type CreateSyncJobInput,
  type CreateSyncJobOutput,
  type BatchCreateSyncJobsInput,
  type BatchCreateSyncJobsOutput,
  // Schemas
  CreateSyncJobInputSchema,
  CreateSyncJobOutputSchema,
  BatchCreateSyncJobsInputSchema,
  BatchCreateSyncJobsOutputSchema,
} from './create-sync-job';

// ============================================================================
// SYNC JOB STATUS UPDATES
// ============================================================================
export {
  // Functions
  updateSyncJobStatus,
  getSyncJobStatus,
  markSyncJobInProgress,
  markSyncJobCompleted,
  markSyncJobFailed,
  bulkUpdateSyncJobs,
  // Types
  type SyncJobStatus,
  type UpdateSyncJobStatusInput,
  type UpdateSyncJobOutput,
  type GetSyncJobStatusInput,
  type GetSyncJobStatusOutput,
  type BulkUpdateSyncJobsInput,
  type BulkUpdateSyncJobsOutput,
  // Schemas
  SyncJobStatusSchema,
  UpdateSyncJobStatusInputSchema,
  UpdateSyncJobOutputSchema,
  GetSyncJobStatusInputSchema,
  GetSyncJobStatusOutputSchema,
  BulkUpdateSyncJobsInputSchema,
  BulkUpdateSyncJobsOutputSchema,
} from './update-sync-job';

// ============================================================================
// SEARCHABLE COLUMNS QUERIES
// ============================================================================
export {
  // Functions
  getSearchableColumns,
  getColumnsNeedingSync,
  getColumnDetailsForSync,
  updateColumnSyncMetadata,
  // Types
  type GetSearchableColumnsInput,
  type SearchableColumn,
  type GetSearchableColumnsOutput,
  type GetColumnsNeedingSyncInput,
  type ColumnsNeedingSyncOutput,
  // Schemas
  GetSearchableColumnsInputSchema,
  SearchableColumnSchema,
  GetSearchableColumnsOutputSchema,
  GetColumnsNeedingSyncInputSchema,
  ColumnsNeedingSyncOutputSchema,
} from './get-searchable-columns';
