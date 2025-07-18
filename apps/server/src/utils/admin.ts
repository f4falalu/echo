import type { OrganizationRole } from '@buster/server-shared/organization';

export const isOrganizationAdmin = (role: OrganizationRole) => {
  return role === 'workspace_admin' || role === 'data_admin';
};
