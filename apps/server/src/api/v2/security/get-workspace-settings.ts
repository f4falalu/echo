import type { GetWorkspaceSettingsResponse } from '@buster/server-shared/security';
import type { User } from '@buster/database';

export async function getWorkspaceSettingsHandler(
  user: User
): Promise<GetWorkspaceSettingsResponse> {
  // TODO: Implement get workspace settings logic
  return {
    restrict_new_user_invitations: false,
    default_role: 'viewer',
    default_datasets: [
      {
        id: '00000000-0000-0000-0000-000000000000',
        name: 'Default Dataset',
      },
    ],
  };
}