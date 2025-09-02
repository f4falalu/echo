import { and, eq, gt, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { dataSources, datasetColumns, datasets } from '../../schema';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const DataSourceForSyncSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.string(),
  organizationId: z.string().uuid(),
  columnsWithStoredValues: z.number().int().min(0),
});

export const GetDataSourcesForSyncOutputSchema = z.object({
  dataSources: z.array(DataSourceForSyncSchema),
  totalCount: z.number().int().min(0),
});

// ============================================================================
// TYPES
// ============================================================================

export type DataSourceForSync = z.infer<typeof DataSourceForSyncSchema>;
export type GetDataSourcesForSyncOutput = z.infer<typeof GetDataSourcesForSyncOutputSchema>;

// ============================================================================
// QUERY FUNCTION
// ============================================================================

/**
 * Get all data sources that have columns with stored_values = true
 * These are the data sources that need to be synced to Turbopuffer
 */
export async function getDataSourcesForSync(): Promise<GetDataSourcesForSyncOutput> {
  try {
    // Query data sources that have at least one column with stored_values = true
    const results = await db
      .selectDistinct({
        id: dataSources.id,
        name: dataSources.name,
        type: dataSources.type,
        organizationId: dataSources.organizationId,
      })
      .from(dataSources)
      .innerJoin(datasets, eq(datasets.dataSourceId, dataSources.id))
      .innerJoin(datasetColumns, eq(datasetColumns.datasetId, datasets.id))
      .where(
        and(
          // Only active data sources
          isNull(dataSources.deletedAt),
          // Only active datasets
          isNull(datasets.deletedAt),
          eq(datasets.enabled, true),
          // Only active columns
          isNull(datasetColumns.deletedAt),
          // Only columns with stored_values enabled
          eq(datasetColumns.storedValues, true),
          // Only successfully onboarded data sources
          eq(dataSources.onboardingStatus, 'completed')
        )
      );

    // Count columns with stored_values for each data source
    const dataSourcesWithCounts = await Promise.all(
      results.map(async (ds) => {
        const columnCount = await db
          .select({
            count: datasetColumns.id,
          })
          .from(datasetColumns)
          .innerJoin(datasets, eq(datasets.id, datasetColumns.datasetId))
          .where(
            and(
              eq(datasets.dataSourceId, ds.id),
              isNull(datasets.deletedAt),
              eq(datasets.enabled, true),
              isNull(datasetColumns.deletedAt),
              eq(datasetColumns.storedValues, true)
            )
          );

        return {
          ...ds,
          columnsWithStoredValues: columnCount.length,
        };
      })
    );

    // Validate and return results
    return GetDataSourcesForSyncOutputSchema.parse({
      dataSources: dataSourcesWithCounts,
      totalCount: dataSourcesWithCounts.length,
    });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error in getDataSourcesForSync: ${error.message}`);
    }

    // Handle database errors
    if (error instanceof Error) {
      throw new Error(`Database error in getDataSourcesForSync: ${error.message}`);
    }

    // Unknown error
    throw new Error(`Unknown error in getDataSourcesForSync: ${String(error)}`);
  }
}

/**
 * Check if a specific data source needs syncing
 * Useful for validating before queuing a sync job
 */
export async function dataSourceNeedsSync(dataSourceId: string): Promise<boolean> {
  try {
    // Validate input
    const validatedId = z.string().uuid().parse(dataSourceId);

    const result = await db
      .select({
        id: datasetColumns.id,
      })
      .from(datasetColumns)
      .innerJoin(datasets, eq(datasets.id, datasetColumns.datasetId))
      .innerJoin(dataSources, eq(dataSources.id, datasets.dataSourceId))
      .where(
        and(
          eq(dataSources.id, validatedId),
          isNull(dataSources.deletedAt),
          eq(dataSources.onboardingStatus, 'completed'),
          isNull(datasets.deletedAt),
          eq(datasets.enabled, true),
          isNull(datasetColumns.deletedAt),
          eq(datasetColumns.storedValues, true)
        )
      )
      .limit(1);

    return result.length > 0;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid dataSourceId: ${error.message}`);
    }
    throw error;
  }
}
