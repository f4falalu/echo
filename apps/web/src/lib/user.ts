import type { UserOrganization } from '@buster/server-shared/user';

export const checkIfUserIsAdmin = (
  userOrganization?: Pick<UserOrganization, 'role'> | null
): boolean => {
  if (!userOrganization) return false;

  if (!userOrganization) return false;

  const userRole = userOrganization.role;

  return userRole === 'data_admin' || userRole === 'workspace_admin';
};
