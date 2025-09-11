import { getDatasetsWithYml } from '@buster/database';
import { logger, schedules } from '@trigger.dev/sdk';
import { isValidFieldName, parseSearchableFields } from './parse-searchable-fields';
import { processSyncJob } from './process-sync-job';
import type { DailySyncReport, DataSourceSyncSummary, SyncJobPayload } from './types';

/**
 * Daily scheduled task to sync searchable values from data sources
 *
 * This task runs every day at 2 AM UTC and:
 * 1. Retrieves datasets with YAML files from the datasets table
 * 2. Parses YAML files to find fields marked as searchable
 * 3. Triggers sync jobs for each searchable field (fire and forget)
 * 4. Reports on the number of syncs triggered
 *
 * The actual sync logic is handled asynchronously by process-sync-job.ts
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
      // Step 1: Get all enabled datasets with YAML files
      const datasets = await getDatasetsWithYml();

      logger.info('Found datasets with YAML files', {
        executionId,
        totalDatasets: datasets.length,
      });

      if (datasets.length === 0) {
        logger.info('No datasets with YAML found to process', { executionId });
        return createReport(executionId, startTime, [], errors);
      }

      // Step 2: Group datasets by data source for efficient processing
      type DatasetWithYml = Awaited<ReturnType<typeof getDatasetsWithYml>>[number];
      const datasetsByDataSource = new Map<string, DatasetWithYml[]>();
      for (const dataset of datasets) {
        const existing = datasetsByDataSource.get(dataset.dataSourceId) || [];
        existing.push(dataset);
        datasetsByDataSource.set(dataset.dataSourceId, existing);
      }

      // Step 3: Process datasets grouped by data source
      for (const [dataSourceId, datasetsForSource] of datasetsByDataSource) {
        // Get first dataset name for logging (all should have same data source)
        const firstDataset = datasetsForSource[0];
        const dataSourceName = firstDataset?.name || 'Unknown';

        const summary: DataSourceSyncSummary = {
          dataSourceId,
          dataSourceName,
          totalColumns: 0, // Will be calculated from searchable fields
          successfulSyncs: 0,
          failedSyncs: 0,
          skippedSyncs: 0,
          totalValuesProcessed: 0,
          errors: [],
        };

        try {
          logger.info('Processing data source', {
            executionId,
            dataSourceId,
            dataSourceName,
            datasetCount: datasetsForSource.length,
          });

          let triggeredCount = 0;
          let triggerFailureCount = 0;
          let totalSearchableFields = 0;

          // Process each dataset for this data source
          for (const dataset of datasetsForSource) {
            if (!dataset.ymlFile) {
              logger.warn('Dataset has no YAML file, skipping', {
                datasetId: dataset.id,
                datasetName: dataset.name,
              });
              continue;
            }

            // Parse YAML to find searchable fields
            const searchableFields = parseSearchableFields(dataset.ymlFile);
            totalSearchableFields += searchableFields.length;

            logger.info('Found searchable fields in dataset', {
              executionId,
              datasetId: dataset.id,
              datasetName: dataset.name,
              searchableFieldCount: searchableFields.length,
            });

            // Trigger sync for each searchable field
            for (const field of searchableFields) {
              // Validate field name to prevent SQL injection
              if (!isValidFieldName(field.name)) {
                logger.error('Invalid field name, skipping', {
                  datasetId: dataset.id,
                  fieldName: field.name,
                });
                summary.errors.push(`Invalid field name in dataset ${dataset.name}: ${field.name}`);
                continue;
              }

              try {
                // Prepare payload for processing
                const syncPayload: SyncJobPayload = {
                  datasetId: dataset.id,
                  datasetName: dataset.name,
                  dataSourceId: dataset.dataSourceId,
                  databaseName: dataset.databaseName,
                  schemaName: dataset.schema,
                  tableName: dataset.name, // Dataset name is the table name
                  columnName: field.name,
                  columnType: field.dataType,
                  // No limit on values - process all distinct values
                };

                // Trigger the sync job without waiting
                await processSyncJob.trigger(syncPayload);
                triggeredCount++;

                logger.info('Sync job triggered for searchable field', {
                  executionId,
                  datasetId: dataset.id,
                  datasetName: dataset.name,
                  table: dataset.name,
                  column: field.name,
                  fieldType: field.type,
                });
              } catch (error) {
                triggerFailureCount++;
                const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                summary.errors.push(
                  `Failed to trigger sync for ${dataset.name}.${field.name}: ${errorMsg}`
                );

                logger.error('Failed to trigger sync job', {
                  executionId,
                  datasetId: dataset.id,
                  datasetName: dataset.name,
                  table: dataset.name,
                  column: field.name,
                  error: errorMsg,
                });
              }
            }
          }

          summary.totalColumns = totalSearchableFields;

          summary.successfulSyncs = triggeredCount;
          summary.failedSyncs = triggerFailureCount;

          dataSourceSummaries.push(summary);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          summary.errors.push(`Data source processing failed: ${errorMsg}`);
          errors.push(`Failed to process data source ${dataSourceName}: ${errorMsg}`);
          dataSourceSummaries.push(summary);

          logger.error('Error processing data source', {
            executionId,
            dataSourceId,
            dataSourceName,
            error: errorMsg,
          });
        }
      }

      // Step 3: Generate and return report
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
