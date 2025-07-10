import type { User } from '@buster/database';
import type { GetWorkspaceSettingsResponse } from '@buster/server-shared/security';
import { HTTPException } from 'hono/http-exception';
import {
  fetchDefaultDatasets,
  fetchOrganization,
  validateUserOrganization,
} from './security-utils';
import { WorkspaceSettingsService } from './workspace-settings-service';

const settingsService = new WorkspaceSettingsService();

export async function getWorkspaceSettingsHandler(
  user: User
): Promise<GetWorkspaceSettingsResponse> {
  try {
    // Validate user organization
    const userOrg = await validateUserOrganization(user.id);

    // Fetch organization and default datasets concurrently
    const [org, defaultDatasets] = await Promise.all([
      fetchOrganization(userOrg.organizationId),
      fetchDefaultDatasets(userOrg.organizationId),
    ]);

    // Return formatted settings response
    return settingsService.formatWorkspaceSettingsResponse({
      restrictNewUserInvitations: org.restrictNewUserInvitations,
      defaultRole: org.defaultRole,
      defaultDatasets,
    });
  } catch (error) {
    console.error('Error in getWorkspaceSettingsHandler:', {
      userId: user.id,
      error: error instanceof Error ? error.message : error,
    });

    // Re-throw HTTPException as is, wrap other errors
    if (error instanceof HTTPException) {
      throw error;
    }

    throw new HTTPException(500, {
      message: 'Failed to fetch workspace settings',
    });
  }
}
