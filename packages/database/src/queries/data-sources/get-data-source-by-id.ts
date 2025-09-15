import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { dataSources } from '../../schema';

// Zod schema for the data source
export const DataSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  organizationId: z.string(),
  secretId: z.string(),
});

export type DataSource = z.infer<typeof DataSourceSchema>;

/**
 * Fetches a data source by its ID
 * @param dataSourceId - The ID of the data source to fetch
 * @returns The data source or null if not found
 */
export async function getDataSourceById(dataSourceId: string): Promise<DataSource | null> {
  const [result] = await db
    .select({
      id: dataSources.id,
      name: dataSources.name,
      type: dataSources.type,
      organizationId: dataSources.organizationId,
      secretId: dataSources.secretId,
    })
    .from(dataSources)
    .where(and(eq(dataSources.id, dataSourceId), isNull(dataSources.deletedAt)))
    .limit(1);

  return result || null;
}
