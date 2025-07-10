import { HTTPException } from 'hono/http-exception';
import { db, getUserOrganizationId, organizations } from '@buster/database';
import { and, eq, isNull } from 'drizzle-orm';

export async function validateUserOrganization(userId: string) {
  const userOrg = await getUserOrganizationId(userId);
  if (!userOrg) {
    throw new HTTPException(403, {
      message: 'User is not associated with an organization',
    });
  }
  return userOrg;
}

export async function fetchOrganization(organizationId: string) {
  const org = await db
    .select()
    .from(organizations)
    .where(
      and(
        eq(organizations.id, organizationId),
        isNull(organizations.deletedAt)
      )
    )
    .limit(1);

  if (!org.length || !org[0]) {
    throw new HTTPException(404, {
      message: 'Organization not found',
    });
  }
  
  return org[0];
}

export function checkAdminPermissions(role: string | null): void {
  if (role !== 'workspace_admin' && role !== 'data_admin') {
    throw new HTTPException(403, {
      message: 'Insufficient permissions to manage approved domains',
    });
  }
}

export function checkWorkspaceAdminPermission(role: string | null): void {
  if (role !== 'workspace_admin') {
    throw new HTTPException(403, {
      message: 'Only workspace admins can update workspace settings',
    });
  }
}