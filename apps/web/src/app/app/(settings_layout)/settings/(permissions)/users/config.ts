import type { OrganizationUser } from '@/api/asset_interfaces';

export const OrganizationUserStatusText: Record<OrganizationUser['status'], string> = {
  active: 'Active',
  inactive: 'Inactive'
};

export const OrganizationUserRoleText: Record<OrganizationUser['role'], string> = {
  data_admin: 'Data Admin',
  workspace_admin: 'Workspace Admin',
  querier: 'Querier',
  restricted_querier: 'Restricted Querier',
  viewer: 'Viewer',
  none: 'None'
};
