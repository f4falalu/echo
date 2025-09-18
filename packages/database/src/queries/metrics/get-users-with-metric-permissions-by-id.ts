import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { assetPermissions, users } from '../../schema';
import {
  AssetPermissionRoleSchema,
  type AssetType,
  type IdentityType,
} from '../../schema-types/enums';

export const GetUsersWithMetricPermissionsInputSchema = z.object({
  metricId: z.string().uuid(),
});

export type GetUsersWithMetricPermissionsInput = z.infer<
  typeof GetUsersWithMetricPermissionsInputSchema
>;

export const GetUsersWithMetricPermissionsResultSchema = z.object({
  role: AssetPermissionRoleSchema,
  email: z.string(),
  name: z.string().nullable(),
  avatarUrl: z.string().nullable(),
});

export type GetUsersWithMetricPermissionsResult = z.infer<
  typeof GetUsersWithMetricPermissionsResultSchema
>;

/**
 * Get all users with direct permissions to a metric
 */
export async function getUsersWithMetricPermissions(
  input: GetUsersWithMetricPermissionsInput
): Promise<GetUsersWithMetricPermissionsResult[]> {
  const validated = GetUsersWithMetricPermissionsInputSchema.parse(input);

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
        eq(assetPermissions.assetId, validated.metricId),
        eq(assetPermissions.assetType, 'metric_file' as AssetType),
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
