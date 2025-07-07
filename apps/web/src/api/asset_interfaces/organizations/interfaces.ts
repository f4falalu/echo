import type { OrganizationRole } from '@buster/server-shared/organization';

export const BusterOrganizationRoleLabels: Record<OrganizationRole, string> = {
  workspace_admin: 'Workspace Admin',
  data_admin: 'Data Admin',
  querier: 'Querier',
  restricted_querier: 'Restricted Querier',
  viewer: 'Viewer',
  none: 'None'
};
