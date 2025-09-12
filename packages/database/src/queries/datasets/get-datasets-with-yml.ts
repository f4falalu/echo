import { and, eq, isNotNull, isNull } from 'drizzle-orm';
import { db } from '../../connection';
import { datasets } from '../../schema';

/**
 * Get all enabled datasets that have YAML files
 * Returns raw dataset data including the YAML content
 */
export async function getDatasetsWithYml() {
  const result = await db
    .select({
      id: datasets.id,
      name: datasets.name,
      dataSourceId: datasets.dataSourceId,
      databaseName: datasets.databaseName,
      schema: datasets.schema,
      ymlFile: datasets.ymlFile,
      organizationId: datasets.organizationId,
    })
    .from(datasets)
    .where(
      and(eq(datasets.enabled, true), isNotNull(datasets.ymlFile), isNull(datasets.deletedAt))
    );

  return result;
}

/**
 * Get datasets by organization with YAML files
 */
export async function getDatasetsWithYmlByOrganization(organizationId: string) {
  const result = await db
    .select({
      id: datasets.id,
      name: datasets.name,
      dataSourceId: datasets.dataSourceId,
      databaseName: datasets.databaseName,
      schema: datasets.schema,
      ymlFile: datasets.ymlFile,
    })
    .from(datasets)
    .where(
      and(
        eq(datasets.organizationId, organizationId),
        eq(datasets.enabled, true),
        isNotNull(datasets.ymlFile),
        isNull(datasets.deletedAt)
      )
    );

  return result;
}
