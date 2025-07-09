import type { OrganizationRole } from './roles.types';

//We need this to avoid postgres dependency in the frontend ☹️
export const OrganizationRoleEnum: Record<OrganizationRole, OrganizationRole> = {
  none: 'none',
  viewer: 'viewer',
  workspace_admin: 'workspace_admin',
  data_admin: 'data_admin',
  querier: 'querier',
  restricted_querier: 'restricted_querier',
};
