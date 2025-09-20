import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { dashboardFiles } from '../../schema';
import type { DashboardFile } from './dashboards';

export const GetDashboardByIdInputSchema = z.object({
  dashboardId: z.string().uuid(),
});

export type GetDashboardByIdInput = z.infer<typeof GetDashboardByIdInputSchema>;

/**
 * Get dashboard file details by ID
 */
export async function getDashboardById(
  input: GetDashboardByIdInput
): Promise<DashboardFile | undefined> {
  const validated = GetDashboardByIdInputSchema.parse(input);

  const [dashboardFile] = await db
    .select()
    .from(dashboardFiles)
    .where(and(eq(dashboardFiles.id, validated.dashboardId), isNull(dashboardFiles.deletedAt)))
    .limit(1);

  return dashboardFile;
}
