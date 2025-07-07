import type { UserResponse } from '@buster/server-shared/user';

export const checkIfUserIsAdmin = (userInfo?: UserResponse | null): boolean => {
  if (!userInfo) return false;

  const userOrganization = userInfo?.organizations?.[0];

  if (!userOrganization) return false;

  const userRole = userOrganization.role;

  return userRole === 'data_admin' || userRole === 'workspace_admin';
};
