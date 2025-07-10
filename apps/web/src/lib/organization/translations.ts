import type { OrganizationRole } from '@buster/server-shared/organization';

export const OrganizationUserRoleText: Record<OrganizationRole, string> = {
  data_admin: 'Data Admin',
  workspace_admin: 'Workspace Admin',
  querier: 'Querier',
  restricted_querier: 'Restricted Querier',
  viewer: 'Viewer',
};
