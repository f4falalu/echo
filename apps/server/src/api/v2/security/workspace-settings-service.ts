import type { 
  GetWorkspaceSettingsResponse,
  UpdateWorkspaceSettingsRequest 
} from '@buster/server-shared/security';

export class WorkspaceSettingsService {
  formatWorkspaceSettingsResponse(settings: {
    restrictNewUserInvitations: boolean;
    defaultRole: string;
  }): GetWorkspaceSettingsResponse {
    return {
      restrict_new_user_invitations: settings.restrictNewUserInvitations,
      default_role: settings.defaultRole,
      default_datasets: [], // TODO: Implement when datasets are available
    };
  }

  buildUpdateData(request: UpdateWorkspaceSettingsRequest): {
    updatedAt: string;
    restrictNewUserInvitations?: boolean;
    defaultRole?: string;
  } {
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

    return updateData;
  }
}