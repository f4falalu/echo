import type {
  UpdateWorkspaceSettingsRequest,
  UpdateWorkspaceSettingsResponse,
} from '@buster/server-shared/security';
import { type User, db, organizations, eq, and, isNull } from '@buster/database';
import { 
  validateUserOrganization, 
  fetchOrganization, 
  checkWorkspaceAdminPermission 
} from './security-utils';
import { WorkspaceSettingsService } from './workspace-settings-service';

const settingsService = new WorkspaceSettingsService();

export async function updateWorkspaceSettingsHandler(
  request: UpdateWorkspaceSettingsRequest,
  user: User
): Promise<UpdateWorkspaceSettingsResponse> {
  // Validate user organization and permissions
  const userOrg = await validateUserOrganization(user.id);
  checkWorkspaceAdminPermission(userOrg.role);

  // Build update data
  const updateData = settingsService.buildUpdateData(request);

  // Update organization settings
  await updateOrganizationSettings(userOrg.organizationId, updateData);

  // Fetch updated organization
  const updatedOrg = await fetchOrganization(userOrg.organizationId);

  // Return formatted response
  return settingsService.formatWorkspaceSettingsResponse({
    restrictNewUserInvitations: updatedOrg.restrictNewUserInvitations,
    defaultRole: updatedOrg.defaultRole,
  });
}

async function updateOrganizationSettings(
  organizationId: string,
  updateData: {
    updatedAt: string;
    restrictNewUserInvitations?: boolean;
    defaultRole?: string;
  }
): Promise<void> {
  await db
    .update(organizations)
    .set(updateData)
    .where(
      and(
        eq(organizations.id, organizationId),
        isNull(organizations.deletedAt)
      )
    );
}