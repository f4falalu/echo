import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { dashboardFiles } from '../../schema';

export const GetDashboardTitleInputSchema = z.object({
  assetId: z.string().uuid(),
  organizationId: z.string().uuid().optional(),
});

export type GetDashboardTitleInput = z.infer<typeof GetDashboardTitleInputSchema>;

// Updated return type to remove null since we now throw an error instead
export async function getDashboardTitle(input: GetDashboardTitleInput): Promise<string> {
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

  // Throw error instead of returning null
  if (!dashboard) {
    throw new Error(`Dashboard with ID ${validated.assetId} not found`);
  }

  // Throw error for permission failure instead of returning null
  if (!dashboard.publiclyAccessible && dashboard.organizationId !== validated.organizationId) {
    throw new Error(
      `Access denied: Dashboard with ID ${validated.assetId} is not publicly accessible and does not belong to the specified organization`
    );
  }

  return dashboard.name;
}
