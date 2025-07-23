import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { metricFiles } from '../../schema';

export const GetMetricTitleInputSchema = z.object({
  assetId: z.string().uuid(),
  organizationId: z.string().uuid().optional(),
});

export type GetMetricTitleInput = z.infer<typeof GetMetricTitleInputSchema>;

export async function getMetricTitle(input: GetMetricTitleInput): Promise<string | null> {
  const validated = GetMetricTitleInputSchema.parse(input);

  const [metric] = await db
    .select({
      name: metricFiles.name,
      publiclyAccessible: metricFiles.publiclyAccessible,
      organizationId: metricFiles.organizationId,
    })
    .from(metricFiles)
    .where(and(eq(metricFiles.id, validated.assetId), isNull(metricFiles.deletedAt)))
    .limit(1);

  if (!metric) {
    return null;
  }

  if (!metric.publiclyAccessible && metric.organizationId !== validated.organizationId) {
    return null;
  }

  return metric.name;
}
