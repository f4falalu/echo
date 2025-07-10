import { type User, and, db, eq, isNull, organizations } from '@buster/database';
import type {
  UpdateWorkspaceSettingsRequest,
  UpdateWorkspaceSettingsResponse,
} from '@buster/server-shared/security';
import { HTTPException } from 'hono/http-exception';
import {
  checkWorkspaceAdminPermission,
  fetchDefaultDatasets,
  fetchOrganization,
  updateDefaultDatasets,
  validateUserOrganization,
} from './security-utils';
import { WorkspaceSettingsService } from './workspace-settings-service';

const settingsService = new WorkspaceSettingsService();

export async function updateWorkspaceSettingsHandler(
  request: UpdateWorkspaceSettingsRequest,
  user: User
): Promise<UpdateWorkspaceSettingsResponse> {
  try {
    // Validate user organization and permissions
    const userOrg = await validateUserOrganization(user.id);
    checkWorkspaceAdminPermission(userOrg.role);

    // Build update data
    const updateData = settingsService.buildUpdateData(request);

    // Update organization settings and default datasets concurrently
    const updatePromises: Promise<void>[] = [
      updateOrganizationSettings(userOrg.organizationId, updateData),
    ];

    // Update default datasets if provided
    if (request.default_datasets_ids !== undefined) {
      updatePromises.push(
        updateDefaultDatasets(
          userOrg.organizationId,
          request.default_datasets_ids.includes('all')
            ? 'all'
            : request.default_datasets_ids.filter((id): id is string => id !== 'all'),
          user.id
        )
      );
    }

    try {
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error during concurrent updates:', {
        userId: user.id,
        organizationId: userOrg.organizationId,
        hasDatasetUpdate: request.default_datasets_ids !== undefined,
        error: error instanceof Error ? error.message : error,
      });
      throw error; // Re-throw to be caught by outer try-catch
    }

    // Fetch updated organization and default datasets
    const [updatedOrg, defaultDatasets] = await Promise.all([
      fetchOrganization(userOrg.organizationId),
      fetchDefaultDatasets(userOrg.organizationId),
    ]);

    // Return formatted response
    return settingsService.formatWorkspaceSettingsResponse({
      restrictNewUserInvitations: updatedOrg.restrictNewUserInvitations,
      defaultRole: updatedOrg.defaultRole,
      defaultDatasets,
    });
  } catch (error) {
    console.error('Error in updateWorkspaceSettingsHandler:', {
      userId: user.id,
      requestFields: {
        hasRestrictNewUserInvitations: request.restrict_new_user_invitations !== undefined,
        hasDefaultRole: request.default_role !== undefined,
        hasDefaultDatasets: request.default_datasets_ids !== undefined,
      },
      error: error instanceof Error ? error.message : error,
    });

    // Re-throw HTTPException as is, wrap other errors
    if (error instanceof HTTPException) {
      throw error;
    }

    throw new HTTPException(500, {
      message: 'Failed to update workspace settings',
    });
  }
}

async function updateOrganizationSettings(
  organizationId: string,
  updateData: {
    updatedAt: string;
    restrictNewUserInvitations?: boolean;
    defaultRole?: string;
  }
): Promise<void> {
  try {
    await db
      .update(organizations)
      .set(updateData)
      .where(and(eq(organizations.id, organizationId), isNull(organizations.deletedAt)));

    console.info('Updated organization settings:', {
      organizationId,
      fields: Object.keys(updateData).filter((k) => k !== 'updatedAt'),
    });
  } catch (error) {
    console.error('Error updating organization settings:', {
      organizationId,
      updateData,
      error: error instanceof Error ? error.message : error,
    });
    throw new HTTPException(500, {
      message: 'Failed to update organization settings',
    });
  }
}
