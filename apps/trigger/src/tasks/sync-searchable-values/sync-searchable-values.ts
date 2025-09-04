import {
  batchCreateSyncJobs,
  getDataSourcesForSync,
  getSearchableColumns,
  markSyncJobFailed,
  markSyncJobInProgress,
} from '@buster/database';
import { checkNamespaceExists, createNamespaceIfNotExists } from '@buster/search';
import { logger, schedules } from '@trigger.dev/sdk';
import { processSyncJob } from './process-sync-job';
import type { DailySyncReport, DataSourceSyncSummary, SyncJobPayload } from './types';

/**
 * Daily scheduled task to sync searchable values from data sources
 *
 * This task runs every day at 2 AM UTC and:
 * 1. Identifies data sources with searchable columns
 * 2. Creates sync jobs for each column that needs syncing
 * 3. Queues individual sync tasks for processing
 * 4. Tracks and reports on the overall sync status
 *
 * The actual sync logic is delegated to process-sync-job.ts (Ticket 8)
 */
export const syncSearchableValues = schedules.task({
  id: 'sync-searchable-values',
  cron: '0 2 * * *', // Daily at 2 AM UTC
  maxDuration: 3600, // 1 hour max execution time
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 30000,
  },
  run: async (payload): Promise<DailySyncReport> => {
    const executionId = crypto.randomUUID();
    const startTime = new Date().toISOString();
    const errors: string[] = [];
    const dataSourceSummaries: DataSourceSyncSummary[] = [];

    logger.info('Starting daily searchable values sync', {
      executionId,
      timestamp: payload.timestamp,
      lastRun: payload.lastTimestamp,
    });

    try {
      // Step 1: Get all data sources that have searchable columns
      const dataSourcesResult = await getDataSourcesForSync();

      logger.info('Found data sources for sync', {
        executionId,
        totalDataSources: dataSourcesResult.totalCount,
        dataSources: dataSourcesResult.dataSources.map((ds) => ({
          id: ds.id,
          name: ds.name,
          columnsWithStoredValues: ds.columnsWithStoredValues,
        })),
      });

      if (dataSourcesResult.totalCount === 0) {
        logger.info('No data sources found with searchable columns', { executionId });
        return createReport(executionId, startTime, [], errors);
      }

      // Step 2: Ensure TurboPuffer namespaces exist for all data sources
      logger.info('Checking TurboPuffer namespaces', {
        executionId,
        dataSourceCount: dataSourcesResult.totalCount,
      });

      for (const dataSource of dataSourcesResult.dataSources) {
        try {
          const namespaceExists = await checkNamespaceExists(dataSource.id);
          if (!namespaceExists) {
            logger.info('Creating TurboPuffer namespace', {
              executionId,
              dataSourceId: dataSource.id,
              dataSourceName: dataSource.name,
            });
            // Namespace will be created automatically on first write
            await createNamespaceIfNotExists(dataSource.id);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          logger.error('Failed to check/create namespace', {
            executionId,
            dataSourceId: dataSource.id,
            dataSourceName: dataSource.name,
            error: errorMsg,
          });
          errors.push(`Failed to check/create namespace for ${dataSource.name}: ${errorMsg}`);
        }
      }

      // Step 3: Process each data source
      for (const dataSource of dataSourcesResult.dataSources) {
        const summary: DataSourceSyncSummary = {
          dataSourceId: dataSource.id,
          dataSourceName: dataSource.name,
          totalColumns: 0,
          successfulSyncs: 0,
          failedSyncs: 0,
          skippedSyncs: 0,
          totalValuesProcessed: 0,
          errors: [],
        };

        try {
          logger.info('Processing data source', {
            executionId,
            dataSourceId: dataSource.id,
            dataSourceName: dataSource.name,
          });

          // Get searchable columns for this data source
          const columnsResult = await getSearchableColumns({
            dataSourceId: dataSource.id,
          });

          summary.totalColumns = columnsResult.totalCount;

          if (columnsResult.totalCount === 0) {
            logger.info('No searchable columns found for data source', {
              executionId,
              dataSourceId: dataSource.id,
            });
            summary.skippedSyncs = summary.totalColumns;
            dataSourceSummaries.push(summary);
            continue;
          }

          // Step 4: Create sync jobs for all columns
          const columnsToSync = columnsResult.columns.map((col) => ({
            databaseName: col.databaseName,
            schemaName: col.schemaName,
            tableName: col.tableName,
            columnName: col.columnName,
          }));

          const batchResult = await batchCreateSyncJobs({
            dataSourceId: dataSource.id,
            syncType: 'daily',
            columns: columnsToSync,
          });

          logger.info('Created sync jobs', {
            executionId,
            dataSourceId: dataSource.id,
            totalCreated: batchResult.totalCreated,
            errors: batchResult.errors.length,
          });

          // Track any errors from job creation
          for (const error of batchResult.errors) {
            summary.errors.push(
              `Failed to create job for ${error.column.tableName}.${error.column.columnName}: ${error.error}`
            );
            summary.failedSyncs++;
          }

          // Step 5: Process each sync job
          const batchSize = 10; // Process in batches
          const jobs = batchResult.created;

          for (let i = 0; i < jobs.length; i += batchSize) {
            const batch = jobs.slice(i, i + batchSize);
            const batchPromises = batch.map(async (job) => {
              try {
                // Mark job as in progress
                await markSyncJobInProgress(job.id);

                // Prepare payload for processing
                const syncPayload: SyncJobPayload = {
                  jobId: job.id,
                  dataSourceId: job.dataSourceId,
                  databaseName: job.databaseName,
                  schemaName: job.schemaName,
                  tableName: job.tableName,
                  columnName: job.columnName,
                  maxValues: 1000,
                };

                // Process the sync job (stub implementation for now)
                const result = await processSyncJob.triggerAndWait(syncPayload);

                if (result.ok && result.output.success) {
                  summary.successfulSyncs++;
                  summary.totalValuesProcessed += result.output.processedCount || 0;
                  logger.info('Sync job completed successfully', {
                    executionId,
                    jobId: job.id,
                    processedCount: result.output.processedCount,
                  });
                } else {
                  summary.failedSyncs++;
                  const errorMsg = result.ok
                    ? result.output.error || 'Unknown error'
                    : 'Task execution failed';
                  summary.errors.push(`Job ${job.id} failed: ${errorMsg}`);

                  // Mark job as failed in database
                  await markSyncJobFailed(job.id, errorMsg);

                  logger.error('Sync job failed', {
                    executionId,
                    jobId: job.id,
                    error: errorMsg,
                  });
                }
              } catch (error) {
                summary.failedSyncs++;
                const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                summary.errors.push(`Job ${job.id} failed: ${errorMsg}`);

                // Mark job as failed in database
                await markSyncJobFailed(job.id, errorMsg);

                logger.error('Error processing sync job', {
                  executionId,
                  jobId: job.id,
                  error: errorMsg,
                });
              }
            });

            // Wait for batch to complete before starting next batch
            await Promise.allSettled(batchPromises);
          }

          dataSourceSummaries.push(summary);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          summary.errors.push(`Data source processing failed: ${errorMsg}`);
          errors.push(`Failed to process data source ${dataSource.name}: ${errorMsg}`);
          dataSourceSummaries.push(summary);

          logger.error('Error processing data source', {
            executionId,
            dataSourceId: dataSource.id,
            error: errorMsg,
          });
        }
      }

      // Step 6: Generate and return report
      const report = createReport(executionId, startTime, dataSourceSummaries, errors);

      logger.info('Daily sync completed', {
        executionId,
        totalDataSources: report.totalDataSources,
        totalColumns: report.totalColumns,
        successfulSyncs: report.successfulSyncs,
        failedSyncs: report.failedSyncs,
        skippedSyncs: report.skippedSyncs,
        durationMs: report.durationMs,
      });

      return report;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Fatal error during sync execution: ${errorMsg}`);

      logger.error('Fatal error in daily sync', {
        executionId,
        error: errorMsg,
      });

      return createReport(executionId, startTime, dataSourceSummaries, errors);
    }
  },
});

/**
 * Helper function to create the daily sync report
 */
function createReport(
  executionId: string,
  startTime: string,
  dataSourceSummaries: DataSourceSyncSummary[],
  errors: string[]
): DailySyncReport {
  const endTime = new Date().toISOString();
  const durationMs = new Date(endTime).getTime() - new Date(startTime).getTime();

  return {
    executionId,
    startTime,
    endTime,
    durationMs,
    totalDataSources: dataSourceSummaries.length,
    totalColumns: dataSourceSummaries.reduce((sum, ds) => sum + ds.totalColumns, 0),
    successfulSyncs: dataSourceSummaries.reduce((sum, ds) => sum + ds.successfulSyncs, 0),
    failedSyncs: dataSourceSummaries.reduce((sum, ds) => sum + ds.failedSyncs, 0),
    skippedSyncs: dataSourceSummaries.reduce((sum, ds) => sum + ds.skippedSyncs, 0),
    totalValuesProcessed: dataSourceSummaries.reduce((sum, ds) => sum + ds.totalValuesProcessed, 0),
    dataSourceSummaries,
    errors,
  };
}
