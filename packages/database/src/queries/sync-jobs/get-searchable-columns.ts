import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { dataSources, datasetColumns, datasets } from '../../schema';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const GetSearchableColumnsInputSchema = z.object({
  dataSourceId: z.string().uuid(),
});

export const SearchableColumnSchema = z.object({
  id: z.string().uuid(),
  datasetId: z.string().uuid(),
  datasetName: z.string(),
  databaseName: z.string(),
  schemaName: z.string(),
  tableName: z.string(),
  columnName: z.string(),
  columnType: z.string(),
  description: z.string().nullable(),
  semanticType: z.string().nullable(),
  storedValuesStatus: z.string().nullable(),
  storedValuesError: z.string().nullable(),
  storedValuesCount: z.number().int().min(0).nullable(),
  storedValuesLastSynced: z.string().datetime().nullable(),
});

export const GetSearchableColumnsOutputSchema = z.object({
  columns: z.array(SearchableColumnSchema),
  totalCount: z.number().int().min(0),
  byDataset: z.record(
    z.string(),
    z.object({
      datasetName: z.string(),
      columns: z.array(SearchableColumnSchema),
      count: z.number().int().min(0),
    })
  ),
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
 * Returns columns where stored_values = true
 */
export async function getSearchableColumns(
  input: GetSearchableColumnsInput
): Promise<GetSearchableColumnsOutput> {
  try {
    const validated = GetSearchableColumnsInputSchema.parse(input);

    // Query all searchable columns for the data source
    const columns = await db
      .select({
        id: datasetColumns.id,
        datasetId: datasetColumns.datasetId,
        datasetName: datasets.name,
        databaseName: datasets.databaseName,
        schemaName: datasets.schema,
        tableName: datasets.name, // Using dataset name as table name
        columnName: datasetColumns.name,
        columnType: datasetColumns.type,
        description: datasetColumns.description,
        semanticType: datasetColumns.semanticType,
        storedValuesStatus: datasetColumns.storedValuesStatus,
        storedValuesError: datasetColumns.storedValuesError,
        storedValuesCount: datasetColumns.storedValuesCount,
        storedValuesLastSynced: datasetColumns.storedValuesLastSynced,
      })
      .from(datasetColumns)
      .innerJoin(datasets, eq(datasets.id, datasetColumns.datasetId))
      .innerJoin(dataSources, eq(dataSources.id, datasets.dataSourceId))
      .where(
        and(
          eq(dataSources.id, validated.dataSourceId),
          isNull(dataSources.deletedAt),
          eq(dataSources.onboardingStatus, 'completed'),
          isNull(datasets.deletedAt),
          eq(datasets.enabled, true),
          isNull(datasetColumns.deletedAt),
          eq(datasetColumns.storedValues, true)
        )
      );

    // Group by dataset for easier consumption
    const byDataset: Record<
      string,
      {
        datasetName: string;
        columns: SearchableColumn[];
        count: number;
      }
    > = {};

    for (const column of columns) {
      const datasetId = column.datasetId;
      if (!byDataset[datasetId]) {
        byDataset[datasetId] = {
          datasetName: column.datasetName,
          columns: [],
          count: 0,
        };
      }
      byDataset[datasetId].columns.push(column as SearchableColumn);
      byDataset[datasetId].count++;
    }

    return GetSearchableColumnsOutputSchema.parse({
      columns,
      totalCount: columns.length,
      byDataset,
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
      if (!column.storedValuesLastSynced) {
        return true;
      }

      // Check if stale
      return column.storedValuesLastSynced < thresholdTimestamp;
    });

    // Count never synced vs stale
    const neverSynced = columnsNeedingSync.filter((c) => !c.storedValuesLastSynced).length;
    const stale = columnsNeedingSync.filter((c) => c.storedValuesLastSynced).length;

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
        databaseName: datasets.databaseName,
        schemaName: datasets.schema,
        tableName: datasets.name,
        columnName: datasetColumns.name,
        columnId: datasetColumns.id,
        lastSynced: datasetColumns.storedValuesLastSynced,
      })
      .from(datasetColumns)
      .innerJoin(datasets, eq(datasets.id, datasetColumns.datasetId))
      .innerJoin(dataSources, eq(dataSources.id, datasets.dataSourceId))
      .where(
        and(
          eq(dataSources.id, validated),
          isNull(dataSources.deletedAt),
          eq(dataSources.onboardingStatus, 'completed'),
          isNull(datasets.deletedAt),
          eq(datasets.enabled, true),
          isNull(datasetColumns.deletedAt),
          eq(datasetColumns.storedValues, true)
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
 * Updates the stored_values columns tracking fields
 */
export async function updateColumnSyncMetadata(
  columnId: string,
  metadata: {
    status: 'syncing' | 'success' | 'failed';
    error?: string | null;
    count?: number;
    lastSynced?: string;
  }
): Promise<void> {
  try {
    const validatedId = z.string().uuid().parse(columnId);

    const updateData: Record<string, unknown> = {
      storedValuesStatus: metadata.status,
    };

    if (metadata.error !== undefined) {
      updateData.storedValuesError = metadata.error;
    }

    if (metadata.count !== undefined) {
      updateData.storedValuesCount = metadata.count;
    }

    if (metadata.lastSynced !== undefined) {
      updateData.storedValuesLastSynced = metadata.lastSynced;
    }

    await db.update(datasetColumns).set(updateData).where(eq(datasetColumns.id, validatedId));
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid columnId: ${error.message}`);
    }

    if (error instanceof Error) {
      throw new Error(`Failed to update column sync metadata: ${error.message}`);
    }

    throw error;
  }
}
