import { and, eq, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { dataSources, storedValuesSyncJobs } from '../../schema';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const GetSearchableColumnsInputSchema = z.object({
  dataSourceId: z.string().uuid(),
});

export const SearchableColumnSchema = z.object({
  id: z.string().uuid(),
  databaseName: z.string(),
  schemaName: z.string(),
  tableName: z.string(),
  columnName: z.string(),
  status: z.string(),
  errorMessage: z.string().nullable(),
  lastSyncedAt: z.string().datetime().nullable(),
});

export const GetSearchableColumnsOutputSchema = z.object({
  columns: z.array(SearchableColumnSchema),
  totalCount: z.number().int().min(0),
});

export const GetColumnsNeedingSyncInputSchema = z.object({
  dataSourceId: z.string().uuid(),
  hoursThreshold: z.number().min(0).optional().default(24), // Default to 24 hours
});

export const ColumnsNeedingSyncOutputSchema = z.object({
  columns: z.array(SearchableColumnSchema),
  totalCount: z.number().int().min(0),
  neverSynced: z.number().int().min(0),
  stale: z.number().int().min(0),
});

// ============================================================================
// TYPES
// ============================================================================

export type GetSearchableColumnsInput = z.infer<typeof GetSearchableColumnsInputSchema>;
export type SearchableColumn = z.infer<typeof SearchableColumnSchema>;
export type GetSearchableColumnsOutput = z.infer<typeof GetSearchableColumnsOutputSchema>;
export type GetColumnsNeedingSyncInput = z.infer<typeof GetColumnsNeedingSyncInputSchema>;
export type ColumnsNeedingSyncOutput = z.infer<typeof ColumnsNeedingSyncOutputSchema>;

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Get all searchable columns for a data source
 * Returns columns from the stored_values_sync_jobs table
 */
export async function getSearchableColumns(
  input: GetSearchableColumnsInput
): Promise<GetSearchableColumnsOutput> {
  try {
    const validated = GetSearchableColumnsInputSchema.parse(input);

    // Query all sync jobs for the data source
    const columns = await db
      .select({
        id: storedValuesSyncJobs.id,
        databaseName: storedValuesSyncJobs.databaseName,
        schemaName: storedValuesSyncJobs.schemaName,
        tableName: storedValuesSyncJobs.tableName,
        columnName: storedValuesSyncJobs.columnName,
        status: storedValuesSyncJobs.status,
        errorMessage: storedValuesSyncJobs.errorMessage,
        lastSyncedAt: storedValuesSyncJobs.lastSyncedAt,
      })
      .from(storedValuesSyncJobs)
      .innerJoin(dataSources, eq(dataSources.id, storedValuesSyncJobs.dataSourceId))
      .where(
        and(
          eq(storedValuesSyncJobs.dataSourceId, validated.dataSourceId),
          isNull(dataSources.deletedAt),
          eq(dataSources.onboardingStatus, 'completed')
        )
      );

    return GetSearchableColumnsOutputSchema.parse({
      columns,
      totalCount: columns.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error in getSearchableColumns: ${error.message}`);
    }

    if (error instanceof Error) {
      throw new Error(`Database error in getSearchableColumns: ${error.message}`);
    }

    throw new Error(`Unknown error in getSearchableColumns: ${String(error)}`);
  }
}

/**
 * Get columns that need to be synced
 * Returns columns that have never been synced or are stale
 */
export async function getColumnsNeedingSync(
  input: GetColumnsNeedingSyncInput
): Promise<ColumnsNeedingSyncOutput> {
  try {
    const validated = GetColumnsNeedingSyncInputSchema.parse(input);

    // Calculate the threshold timestamp
    const thresholdDate = new Date();
    thresholdDate.setHours(thresholdDate.getHours() - validated.hoursThreshold);
    const thresholdTimestamp = thresholdDate.toISOString();

    // Query all searchable columns
    const allColumns = await getSearchableColumns({
      dataSourceId: validated.dataSourceId,
    });

    // Filter columns that need syncing
    const columnsNeedingSync = allColumns.columns.filter((column) => {
      // Never synced
      if (!column.lastSyncedAt) {
        return true;
      }

      // Check if stale
      return column.lastSyncedAt < thresholdTimestamp;
    });

    // Count never synced vs stale
    const neverSynced = columnsNeedingSync.filter((c) => !c.lastSyncedAt).length;
    const stale = columnsNeedingSync.filter((c) => c.lastSyncedAt).length;

    return ColumnsNeedingSyncOutputSchema.parse({
      columns: columnsNeedingSync,
      totalCount: columnsNeedingSync.length,
      neverSynced,
      stale,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error in getColumnsNeedingSync: ${error.message}`);
    }

    throw error;
  }
}

/**
 * Get column details for sync job creation
 * Returns the minimum information needed to create sync jobs
 */
export async function getColumnDetailsForSync(dataSourceId: string) {
  try {
    const validated = z.string().uuid().parse(dataSourceId);

    const columns = await db
      .select({
        databaseName: storedValuesSyncJobs.databaseName,
        schemaName: storedValuesSyncJobs.schemaName,
        tableName: storedValuesSyncJobs.tableName,
        columnName: storedValuesSyncJobs.columnName,
        columnId: storedValuesSyncJobs.id,
        lastSynced: storedValuesSyncJobs.lastSyncedAt,
      })
      .from(storedValuesSyncJobs)
      .innerJoin(dataSources, eq(dataSources.id, storedValuesSyncJobs.dataSourceId))
      .where(
        and(
          eq(storedValuesSyncJobs.dataSourceId, validated),
          isNull(dataSources.deletedAt),
          eq(dataSources.onboardingStatus, 'completed')
        )
      );

    return columns;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid dataSourceId: ${error.message}`);
    }

    throw error;
  }
}

/**
 * Update column sync metadata after successful sync
 * Updates the stored_values_sync_jobs table
 */
export async function updateColumnSyncMetadata(
  syncJobId: string,
  metadata: {
    status: 'syncing' | 'success' | 'failed' | 'error';
    error?: string | null;
    lastSynced?: string;
  }
): Promise<void> {
  try {
    const validatedId = z.string().uuid().parse(syncJobId);

    const updateData: Record<string, unknown> = {
      status: metadata.status,
    };

    if (metadata.error !== undefined) {
      updateData.errorMessage = metadata.error;
    }

    if (metadata.lastSynced !== undefined) {
      updateData.lastSyncedAt = metadata.lastSynced;
    }

    await db.update(storedValuesSyncJobs).set(updateData).where(eq(storedValuesSyncJobs.id, validatedId));
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid syncJobId: ${error.message}`);
    }

    if (error instanceof Error) {
      throw new Error(`Failed to update column sync metadata: ${error.message}`);
    }

    throw error;
  }
}
