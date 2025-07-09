import type {
  UpdateWorkspaceSettingsRequest,
  UpdateWorkspaceSettingsResponse,
} from '@buster/server-shared/security';
import type { User } from '@buster/database';

export async function updateWorkspaceSettingsHandler(
  request: UpdateWorkspaceSettingsRequest,
  user: User
): Promise<UpdateWorkspaceSettingsResponse> {
  // TODO: Implement update workspace settings logic
  return {
    restrict_new_user_invitations: request.restrict_new_user_invitations ?? false,
    default_role: request.default_role ?? 'viewer',
    default_datasets: [
      {
        id: '00000000-0000-0000-0000-000000000000',
        name: 'Default Dataset',
      },
    ],
  };
}