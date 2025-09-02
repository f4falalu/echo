import { markSyncJobCompleted } from '@buster/database';
import { logger, schemaTask } from '@trigger.dev/sdk';
import { type SyncJobPayload, SyncJobPayloadSchema, type SyncJobResult } from './types';

/**
 * Task to process an individual searchable values sync job
 *
 * This is a STUB implementation for Ticket 7.
 * The full implementation will be added in Ticket 8.
 *
 * In Ticket 8, this task will:
 * 1. Connect to the data source using the provided credentials
 * 2. Query distinct values from the specified column
 * 3. Store the values in the searchable values cache
 * 4. Update the sync job status with results
 *
 * For now, it simply logs and returns success to allow the daily
 * cron job to be tested end-to-end.
 */
export const processSyncJob: ReturnType<
  typeof schemaTask<'process-sync-job', typeof SyncJobPayloadSchema, SyncJobResult>
> = schemaTask({
  id: 'process-sync-job',
  schema: SyncJobPayloadSchema,
  maxDuration: 300, // 5 minutes per job
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
  },
  run: async (payload): Promise<SyncJobResult> => {
    const startTime = Date.now();

    logger.info('Processing sync job (STUB)', {
      jobId: payload.jobId,
      dataSourceId: payload.dataSourceId,
      column: {
        database: payload.databaseName,
        schema: payload.schemaName,
        table: payload.tableName,
        column: payload.columnName,
      },
    });

    try {
      // TODO (Ticket 8): Implement actual sync logic
      // 1. Get data source credentials
      // 2. Connect to data source
      // 3. Query distinct values with limit
      // 4. Store values in cache
      // 5. Update column metadata

      // Simulate some processing time
      await new Promise((resolve) => setTimeout(resolve, 100));

      // For now, just mark the job as completed with stub data
      const metadata = {
        processedCount: 100, // Stub value
        existingCount: 20, // Stub value
        newCount: 80, // Stub value
        duration: Date.now() - startTime,
        syncedAt: new Date().toISOString(),
      };

      await markSyncJobCompleted(payload.jobId, metadata);

      logger.info('Sync job completed (STUB)', {
        jobId: payload.jobId,
        processedCount: metadata.processedCount,
        duration: metadata.duration,
      });

      return {
        jobId: payload.jobId,
        success: true,
        processedCount: metadata.processedCount,
        existingCount: metadata.existingCount,
        newCount: metadata.newCount,
        duration: metadata.duration,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error('Sync job failed (STUB)', {
        jobId: payload.jobId,
        error: errorMessage,
      });

      return {
        jobId: payload.jobId,
        success: false,
        error: errorMessage,
      };
    }
  },
});

/**
 * TODO (Ticket 8): Helper functions to be implemented
 *
 * - connectToDataSource(dataSourceId: string): Promise<DataSourceConnection>
 * - queryDistinctValues(connection, column, limit): Promise<string[]>
 * - storeSearchableValues(values, column): Promise<StorageResult>
 * - updateColumnMetadata(columnId, metadata): Promise<void>
 * - cleanupConnection(connection): Promise<void>
 */
