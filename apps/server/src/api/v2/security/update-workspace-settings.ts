import type {
  UpdateWorkspaceSettingsRequest,
  UpdateWorkspaceSettingsResponse,
} from '@buster/server-shared/security';
import { 
  type User, 
  db, 
  getUserOrganizationId, 
  organizations, 
  eq, 
  and, 
  isNull 
} from '@buster/database';
import { HTTPException } from 'hono/http-exception';

export async function updateWorkspaceSettingsHandler(
  request: UpdateWorkspaceSettingsRequest,
  user: User
): Promise<UpdateWorkspaceSettingsResponse> {
  // Get user's organization
  const userOrg = await getUserOrganizationId(user.id);
  
  if (!userOrg) {
    throw new HTTPException(403, {
      message: 'User is not associated with an organization',
    });
  }

  // Check if user has admin role
  if (userOrg.role !== 'workspace_admin') {
    throw new HTTPException(403, {
      message: 'Only workspace admins can update workspace settings',
    });
  }

  // Build update object with only provided fields
  const updateData: {
    updatedAt: string;
    restrictNewUserInvitations?: boolean;
    defaultRole?: string;
  } = {
    updatedAt: new Date().toISOString(),
  };

  if (request.restrict_new_user_invitations !== undefined) {
    updateData.restrictNewUserInvitations = request.restrict_new_user_invitations;
  }

  if (request.default_role !== undefined) {
    updateData.defaultRole = request.default_role;
  }

  // TODO: Handle default_datasets_ids logic
  // For now, we'll ignore this field as requested
  // The logic for mapping dataset IDs to actual datasets
  // and handling the special "all" value will need to be implemented

  // Update organization settings
  await db
    .update(organizations)
    .set(updateData)
    .where(
      and(
        eq(organizations.id, userOrg.organizationId),
        isNull(organizations.deletedAt)
      )
    );

  // Fetch updated organization settings
  const updatedOrg = await db
    .select({
      restrictNewUserInvitations: organizations.restrictNewUserInvitations,
      defaultRole: organizations.defaultRole,
    })
    .from(organizations)
    .where(
      and(
        eq(organizations.id, userOrg.organizationId),
        isNull(organizations.deletedAt)
      )
    )
    .limit(1);

  if (!updatedOrg.length || !updatedOrg[0]) {
    throw new HTTPException(404, {
      message: 'Organization not found after update',
    });
  }

  const { restrictNewUserInvitations, defaultRole } = updatedOrg[0];

  // TODO: Implement default datasets logic
  // For now, return an empty array as a placeholder
  // This will need to be implemented based on your custom logic
  const defaultDatasets: Array<{ id: string; name: string }> = [];

  return {
    restrict_new_user_invitations: restrictNewUserInvitations,
    default_role: defaultRole,
    default_datasets: defaultDatasets,
  };
}