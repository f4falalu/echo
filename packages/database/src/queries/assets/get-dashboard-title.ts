import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { dashboardFiles } from '../../schema';

export const GetDashboardTitleInputSchema = z.object({
  assetId: z.string().uuid(),
  organizationId: z.string().uuid().optional(),
});

export type GetDashboardTitleInput = z.infer<typeof GetDashboardTitleInputSchema>;

export async function getDashboardTitle(input: GetDashboardTitleInput): Promise<string | null> {
  const validated = GetDashboardTitleInputSchema.parse(input);

  const [dashboard] = await db
    .select({
      name: dashboardFiles.name,
      publiclyAccessible: dashboardFiles.publiclyAccessible,
      organizationId: dashboardFiles.organizationId,
    })
    .from(dashboardFiles)
    .where(and(eq(dashboardFiles.id, validated.assetId), isNull(dashboardFiles.deletedAt)))
    .limit(1);

  if (!dashboard) {
    return null;
  }

  if (!dashboard.publiclyAccessible && dashboard.organizationId !== validated.organizationId) {
    return null;
  }

  return dashboard.name;
}
