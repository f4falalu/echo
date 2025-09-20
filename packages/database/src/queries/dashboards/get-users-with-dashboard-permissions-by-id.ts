import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { assetPermissions, users } from '../../schema';
import { AssetPermissionRoleSchema, type AssetType, type IdentityType } from '../../schema-types';

export const GetUsersWithDashboardPermissionsInputSchema = z.object({
  dashboardId: z.string().uuid(),
});

export type GetUsersWithDashboardPermissionsInput = z.infer<
  typeof GetUsersWithDashboardPermissionsInputSchema
>;

export const GetUsersWithDashboardPermissionsResultSchema = z.object({
  role: AssetPermissionRoleSchema,
  email: z.string(),
  name: z.string().nullable(),
  avatarUrl: z.string().nullable(),
});

export type GetUsersWithDashboardPermissionsResult = z.infer<
  typeof GetUsersWithDashboardPermissionsResultSchema
>;

/**
 * Get all users with direct permissions to a dashboard
 */
export async function getUsersWithDashboardPermissions(
  input: GetUsersWithDashboardPermissionsInput
): Promise<GetUsersWithDashboardPermissionsResult[]> {
  const validated = GetUsersWithDashboardPermissionsInputSchema.parse(input);

  const individualPermissions = await db
    .select({
      role: assetPermissions.role,
      email: users.email,
      name: users.name,
      avatarUrl: users.avatarUrl,
    })
    .from(assetPermissions)
    .innerJoin(users, eq(users.id, assetPermissions.identityId))
    .where(
      and(
        eq(assetPermissions.assetId, validated.dashboardId),
        eq(assetPermissions.assetType, 'dashboard_file' as AssetType),
        eq(assetPermissions.identityType, 'user' as IdentityType),
        isNull(assetPermissions.deletedAt)
      )
    );

  return individualPermissions.map((row) => ({
    role: row.role,
    email: row.email,
    name: row.name,
    avatarUrl: row.avatarUrl,
  }));
}
