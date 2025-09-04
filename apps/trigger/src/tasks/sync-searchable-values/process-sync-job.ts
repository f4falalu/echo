import { generateSearchableValueEmbeddings } from '@buster/ai';
import { type DatabaseAdapter, createAdapter } from '@buster/data-source';
import {
  getDataSourceCredentials,
  markSyncJobCompleted,
  markSyncJobFailed,
} from '@buster/database';
import {
  type SearchableValue,
  deduplicateValues,
  generateNamespace,
  queryExistingKeys,
  upsertSearchableValues,
} from '@buster/search';
import { logger, schemaTask } from '@trigger.dev/sdk';
import { type SyncJobPayload, SyncJobPayloadSchema, type SyncJobResult } from './types';

/**
 * Task to process an individual searchable values sync job
 *
 * This task orchestrates the complete sync workflow:
 * 1. Fetches credentials and connects to the data source
 * 2. Queries distinct values from the specified column
 * 3. Queries existing values from Turbopuffer
 * 4. Deduplicates to find new values
 * 5. Generates embeddings for new values
 * 6. Upserts values with embeddings to Turbopuffer
 * 7. Updates sync job and column metadata
 */
export const processSyncJob: ReturnType<
  typeof schemaTask<'process-sync-job', typeof SyncJobPayloadSchema, SyncJobResult>
> = schemaTask({
  id: 'process-sync-job',
  schema: SyncJobPayloadSchema,
  maxDuration: 300, // 5 minutes per job
  machine: {
    preset: 'large-1x', // 4 vCPU, 8 GB RAM for handling large datasets
  },
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
  },
  run: async (payload): Promise<SyncJobResult> => {
    const startTime = Date.now();

    logger.info('Starting sync job processing', {
      jobId: payload.jobId,
      dataSourceId: payload.dataSourceId,
      column: {
        database: payload.databaseName,
        schema: payload.schemaName,
        table: payload.tableName,
        column: payload.columnName,
      },
      maxValues: payload.maxValues,
    });

    let adapter: DatabaseAdapter | null = null;

    try {
      // Step 1: Get data source credentials
      logger.info('Fetching data source credentials', { dataSourceId: payload.dataSourceId });
      const credentials = await getDataSourceCredentials({
        dataSourceId: payload.dataSourceId,
      });

      // Step 2: Create and connect adapter
      logger.info('Creating database adapter', { dataSourceId: payload.dataSourceId });
      // @ts-expect-error - credentials type is flexible across different database types
      adapter = await createAdapter(credentials);
      await adapter.testConnection();

      // Step 3: Query distinct values from the source column
      logger.info('Querying distinct values from source', {
        table: `${payload.databaseName}.${payload.schemaName}.${payload.tableName}`,
        column: payload.columnName,
        limit: payload.maxValues,
      });

      const distinctValues = await queryDistinctColumnValues({
        adapter,
        databaseName: payload.databaseName,
        schemaName: payload.schemaName,
        tableName: payload.tableName,
        columnName: payload.columnName,
        limit: payload.maxValues,
      });

      logger.info('Retrieved distinct values', {
        jobId: payload.jobId,
        totalValues: distinctValues.length,
      });

      if (distinctValues.length === 0) {
        // No values to sync
        const result: SyncJobResult = {
          jobId: payload.jobId,
          success: true,
          processedCount: 0,
          existingCount: 0,
          newCount: 0,
          duration: Date.now() - startTime,
        };

        await markSyncJobCompleted(payload.jobId, {
          processedCount: 0,
          existingCount: 0,
          newCount: 0,
          duration: result.duration || 0,
        });

        logger.info('No values to sync', { jobId: payload.jobId });
        return result;
      }

      // Step 4: Query existing keys from Turbopuffer
      // Note: If namespace doesn't exist, it means no data has been written yet
      // and we should treat it as having no existing keys
      const namespace = generateNamespace(payload.dataSourceId);
      logger.info('Querying existing values from Turbopuffer', {
        namespace,
        database: payload.databaseName,
        schema: payload.schemaName,
        table: payload.tableName,
        column: payload.columnName,
      });

      let existingKeys: string[] = [];
      try {
        existingKeys = await queryExistingKeys({
          dataSourceId: payload.dataSourceId,
          query: {
            database: payload.databaseName,
            schema: payload.schemaName,
            table: payload.tableName,
            column: payload.columnName,
          },
        });
      } catch (error) {
        // Check if this is a namespace not found error (404)
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('namespace') && errorMessage.includes('was not found')) {
          logger.info('Namespace does not exist yet, treating as empty', {
            namespace,
            jobId: payload.jobId,
          });
          existingKeys = [];
        } else {
          // Re-throw if it's not a namespace not found error
          throw error;
        }
      }

      logger.info('Retrieved existing keys', {
        jobId: payload.jobId,
        existingCount: existingKeys.length,
      });

      // Step 5: Prepare searchable values for deduplication
      const searchableValues: SearchableValue[] = distinctValues.map((value) => ({
        database: payload.databaseName,
        schema: payload.schemaName,
        table: payload.tableName,
        column: payload.columnName,
        value,
      }));

      // Step 6: Deduplicate using DuckDB
      logger.info('Deduplicating values', {
        jobId: payload.jobId,
        totalValues: searchableValues.length,
        existingKeys: existingKeys.length,
      });

      const deduplicationResult = await deduplicateValues({
        existingKeys,
        newValues: searchableValues,
      });

      logger.info('Deduplication complete', {
        jobId: payload.jobId,
        newCount: deduplicationResult.newCount,
        existingCount: deduplicationResult.existingCount,
      });

      if (deduplicationResult.newCount === 0) {
        // All values already exist
        const result: SyncJobResult = {
          jobId: payload.jobId,
          success: true,
          processedCount: searchableValues.length,
          existingCount: deduplicationResult.existingCount,
          newCount: 0,
          duration: Date.now() - startTime,
        };

        await markSyncJobCompleted(payload.jobId, {
          processedCount: searchableValues.length,
          existingCount: deduplicationResult.existingCount,
          newCount: 0,
          duration: result.duration || 0,
        });

        // TODO: Update column sync metadata when we have column ID
        // await updateColumnSyncMetadata(columnId, {
        //   status: 'success',
        //   count: searchableValues.length,
        //   lastSynced: new Date().toISOString(),
        // });

        logger.info('All values already exist in Turbopuffer', { jobId: payload.jobId });
        return result;
      }

      // Step 7: Generate embeddings for new values in batches to manage memory
      logger.info('Generating embeddings for new values', {
        jobId: payload.jobId,
        newCount: deduplicationResult.newCount,
      });

      // Process embeddings in batches to avoid memory issues
      const EMBEDDING_BATCH_SIZE = 1000; // Process 1000 values at a time
      const allValuesWithEmbeddings: SearchableValue[] = [];

      for (let i = 0; i < deduplicationResult.newValues.length; i += EMBEDDING_BATCH_SIZE) {
        const batch = deduplicationResult.newValues.slice(i, i + EMBEDDING_BATCH_SIZE);
        const batchTexts = batch.map((v) => v.value);

        logger.info('Processing embedding batch', {
          jobId: payload.jobId,
          batchStart: i,
          batchSize: batch.length,
          totalValues: deduplicationResult.newValues.length,
        });

        // Generate embeddings for this batch
        const batchEmbeddings = await generateSearchableValueEmbeddings(batchTexts);

        // Combine values with embeddings for this batch
        const batchWithEmbeddings = batch.map((value, index) => ({
          ...value,
          embedding: batchEmbeddings[index],
          synced_at: new Date().toISOString(),
        }));

        allValuesWithEmbeddings.push(...batchWithEmbeddings);
      }

      // Step 8: Upsert to Turbopuffer in batches to manage memory
      logger.info('Upserting values to Turbopuffer', {
        jobId: payload.jobId,
        count: allValuesWithEmbeddings.length,
      });

      // Process upserts in batches to avoid memory and API limits
      const UPSERT_BATCH_SIZE = 500; // Upsert 500 values at a time
      let totalUpserted = 0;

      for (let i = 0; i < allValuesWithEmbeddings.length; i += UPSERT_BATCH_SIZE) {
        const batch = allValuesWithEmbeddings.slice(i, i + UPSERT_BATCH_SIZE);

        logger.info('Processing upsert batch', {
          jobId: payload.jobId,
          batchStart: i,
          batchSize: batch.length,
          totalValues: allValuesWithEmbeddings.length,
        });

        const batchResult = await upsertSearchableValues({
          dataSourceId: payload.dataSourceId,
          values: batch,
        });

        totalUpserted += batchResult.upserted;
        if (batchResult.errors && batchResult.errors.length > 0) {
          // Log and throw error for any upsert failures
          logger.error('Upsert batch failed', {
            jobId: payload.jobId,
            batchStart: i,
            batchSize: batch.length,
            errorsInBatch: batchResult.errors.length,
            errors: batchResult.errors,
          });
          
          throw new Error(
            `Failed to upsert ${batchResult.errors.length} values to Turbopuffer: ${batchResult.errors.slice(0, 3).join(', ')}${batchResult.errors.length > 3 ? '...' : ''}`
          );
        }
      }

      logger.info('All upserts completed successfully', {
        jobId: payload.jobId,
        totalUpserted: totalUpserted,
      });

      // Step 9: Update sync job status
      const metadata = {
        processedCount: searchableValues.length,
        existingCount: deduplicationResult.existingCount,
        newCount: deduplicationResult.newCount,
        duration: Date.now() - startTime,
      };

      await markSyncJobCompleted(payload.jobId, metadata);

      // TODO: Update column sync metadata when we have column ID
      // await updateColumnSyncMetadata(columnId, {
      //   status: 'success',
      //   count: searchableValues.length,
      //   lastSynced: new Date().toISOString(),
      // });

      logger.info('Sync job completed successfully', {
        jobId: payload.jobId,
        processedCount: metadata.processedCount,
        newCount: metadata.newCount,
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

      logger.error('Sync job failed', {
        jobId: payload.jobId,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Mark job as failed
      await markSyncJobFailed(payload.jobId, errorMessage);

      // TODO: Update column sync metadata with error when we have column ID
      // await updateColumnSyncMetadata(columnId, {
      //   status: 'failed',
      //   error: errorMessage,
      // }).catch((updateError) => {
      //   logger.error('Failed to update column metadata', {
      //     jobId: payload.jobId,
      //     error: updateError instanceof Error ? updateError.message : 'Unknown error',
      //   });
      // });

      return {
        jobId: payload.jobId,
        success: false,
        error: errorMessage,
      };
    } finally {
      // Clean up database connection
      if (adapter) {
        try {
          await adapter.close();
          logger.info('Database connection closed', { jobId: payload.jobId });
        } catch (disconnectError) {
          logger.error('Failed to disconnect database adapter', {
            jobId: payload.jobId,
            error: disconnectError instanceof Error ? disconnectError.message : 'Unknown error',
          });
        }
      }
    }
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Query distinct values from a specific column in the data source
 * Handles different database types and returns unique text values
 */
async function queryDistinctColumnValues({
  adapter,
  databaseName,
  schemaName,
  tableName,
  columnName,
  limit,
}: {
  adapter: DatabaseAdapter;
  databaseName: string;
  schemaName: string;
  tableName: string;
  columnName: string;
  limit: number;
}): Promise<string[]> {
  // Build the fully qualified table name
  const fullyQualifiedTable = `${databaseName}.${schemaName}.${tableName}`;

  // Build the query to get distinct non-null values
  // Using parameterized identifiers for safety
  const query = `
    SELECT DISTINCT "${columnName}" AS value
    FROM ${fullyQualifiedTable}
    WHERE "${columnName}" IS NOT NULL
      AND TRIM("${columnName}") != ''
    ORDER BY "${columnName}"
    LIMIT ${limit}
  `;

  logger.info('Executing distinct values query', {
    table: fullyQualifiedTable,
    column: columnName,
    limit,
  });

  try {
    const result = await adapter.query(query);

    // Extract values from the result
    const values: string[] = [];
    for (const row of result.rows) {
      const value = row.value;
      if (
        value !== null &&
        value !== undefined &&
        typeof value === 'string' &&
        value.trim() !== ''
      ) {
        values.push(value);
      }
    }

    return values;
  } catch (error) {
    logger.error('Failed to query distinct values', {
      table: fullyQualifiedTable,
      column: columnName,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new Error(
      `Failed to query distinct values from ${fullyQualifiedTable}.${columnName}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}
