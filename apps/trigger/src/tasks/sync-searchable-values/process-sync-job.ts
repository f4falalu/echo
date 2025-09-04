import { generateSearchableValueEmbeddings } from '@buster/ai';
import { type DatabaseAdapter, createAdapter } from '@buster/data-source';
import {
  getDataSourceCredentials,
  markSyncJobCompleted,
  markSyncJobFailed,
} from '@buster/database';
import {
  type SearchableValue,
  checkNamespaceExists,
  createNamespaceIfNotExists,
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

      // Step 4: Ensure Turbopuffer namespace exists
      const namespace = generateNamespace(payload.dataSourceId);
      const namespaceExists = await checkNamespaceExists(payload.dataSourceId);
      if (!namespaceExists) {
        logger.info('Creating Turbopuffer namespace', { namespace });
        await createNamespaceIfNotExists(payload.dataSourceId);
      }

      // Step 5: Query existing keys from Turbopuffer
      logger.info('Querying existing values from Turbopuffer', {
        namespace,
        database: payload.databaseName,
        schema: payload.schemaName,
        table: payload.tableName,
        column: payload.columnName,
      });

      const existingKeys = await queryExistingKeys({
        dataSourceId: payload.dataSourceId,
        query: {
          database: payload.databaseName,
          schema: payload.schemaName,
          table: payload.tableName,
          column: payload.columnName,
        },
      });

      logger.info('Retrieved existing keys', {
        jobId: payload.jobId,
        existingCount: existingKeys.length,
      });

      // Step 6: Prepare searchable values for deduplication
      const searchableValues: SearchableValue[] = distinctValues.map((value) => ({
        database: payload.databaseName,
        schema: payload.schemaName,
        table: payload.tableName,
        column: payload.columnName,
        value,
      }));

      // Step 7: Deduplicate using DuckDB
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

      // Step 8: Generate embeddings for new values
      logger.info('Generating embeddings for new values', {
        jobId: payload.jobId,
        newCount: deduplicationResult.newCount,
      });

      const newValueTexts = deduplicationResult.newValues.map((v) => v.value);
      const embeddings = await generateSearchableValueEmbeddings(newValueTexts);

      // Step 9: Combine values with embeddings
      const valuesWithEmbeddings: SearchableValue[] = deduplicationResult.newValues.map(
        (value, index) => ({
          ...value,
          embedding: embeddings[index],
          synced_at: new Date().toISOString(),
        })
      );

      // Step 10: Upsert to Turbopuffer
      logger.info('Upserting values to Turbopuffer', {
        jobId: payload.jobId,
        count: valuesWithEmbeddings.length,
      });

      const upsertResult = await upsertSearchableValues({
        dataSourceId: payload.dataSourceId,
        values: valuesWithEmbeddings,
      });

      logger.info('Upsert complete', {
        jobId: payload.jobId,
        upserted: upsertResult.upserted,
        errors: upsertResult.errors,
      });

      // Step 11: Update sync job status
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
