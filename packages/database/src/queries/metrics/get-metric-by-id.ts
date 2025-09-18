import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../connection';
import { metricFiles } from '../../schema';

export type MetricFile = typeof metricFiles.$inferSelect;

/**
 * Get metric_file by id
 */
export async function getMetricFileById(metricId: string): Promise<MetricFile | undefined> {
  const [metricResult] = await db
    .select()
    .from(metricFiles)
    .where(and(eq(metricFiles.id, metricId), isNull(metricFiles.deletedAt)))
    .limit(1);

  return metricResult;
}
