import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { dataSources, metricFiles } from '../../schema';

export const GetMetricForExportInputSchema = z.object({
  metricId: z.string().uuid(),
});

export type GetMetricForExportInput = z.infer<typeof GetMetricForExportInputSchema>;

export interface MetricForExport {
  id: string;
  name: string;
  content: any; // JSONB content containing SQL and other metadata
  dataSourceId: string;
  organizationId: string;
  secretId: string;
  dataSourceType: string;
  sql?: string;
}

/**
 * Fetches metric details along with data source information for export
 * Includes the SQL query and credentials needed to execute it
 */
export async function getMetricForExport(input: GetMetricForExportInput): Promise<MetricForExport> {
  const validated = GetMetricForExportInputSchema.parse(input);

  const [result] = await db
    .select({
      id: metricFiles.id,
      name: metricFiles.name,
      content: metricFiles.content,
      dataSourceId: metricFiles.dataSourceId,
      organizationId: metricFiles.organizationId,
      secretId: dataSources.secretId,
      dataSourceType: dataSources.type,
    })
    .from(metricFiles)
    .innerJoin(dataSources, eq(metricFiles.dataSourceId, dataSources.id))
    .where(
      and(
        eq(metricFiles.id, validated.metricId),
        isNull(metricFiles.deletedAt),
        isNull(dataSources.deletedAt)
      )
    )
    .limit(1);

  if (!result) {
    throw new Error(`Metric with ID ${validated.metricId} not found or has been deleted`);
  }

  // Extract SQL from metric content
  // The content structure may vary, so we check multiple possible locations
  let sql: string | undefined;

  if (typeof result.content === 'object' && result.content !== null) {
    // Check common locations for SQL in metric content
    const content = result.content as Record<string, any>;
    sql =
      content.sql ||
      content.query ||
      content.sqlQuery ||
      content.definition?.sql ||
      content.definition?.query;
  }

  if (!sql) {
    throw new Error(`No SQL query found in metric ${validated.metricId}`);
  }

  return {
    id: result.id,
    name: result.name,
    content: result.content,
    dataSourceId: result.dataSourceId,
    organizationId: result.organizationId,
    secretId: result.secretId,
    dataSourceType: result.dataSourceType,
    sql,
  };
}
