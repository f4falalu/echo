import type { GetWorkspaceSettingsResponse } from '@buster/server-shared/security';
import { type User } from '@buster/database';
import { validateUserOrganization, fetchOrganization } from './security-utils';
import { WorkspaceSettingsService } from './workspace-settings-service';

const settingsService = new WorkspaceSettingsService();

export async function getWorkspaceSettingsHandler(
  user: User
): Promise<GetWorkspaceSettingsResponse> {
  // Validate user organization
  const userOrg = await validateUserOrganization(user.id);

  // Fetch organization
  const org = await fetchOrganization(userOrg.organizationId);

  // Return formatted settings response
  return settingsService.formatWorkspaceSettingsResponse({
    restrictNewUserInvitations: org.restrictNewUserInvitations,
    defaultRole: org.defaultRole,
  });
}