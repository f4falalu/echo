import type { UserOrganizationRole } from '@buster/server-shared/organization';

export const isOrganizationAdmin = (role: UserOrganizationRole) => {
  return role === 'workspace_admin' || role === 'data_admin';
};
