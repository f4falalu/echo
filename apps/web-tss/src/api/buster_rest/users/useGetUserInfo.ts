import type { UserResponse } from '@buster/server-shared/user';
import { useQuery } from '@tanstack/react-query';
import { userQueryKeys } from '@/api/query_keys/users';

const stableSelectUserOrganization = (data: UserResponse | null) => {
  const firstOrganization = data?.organizations?.[0];
  return firstOrganization || null;
};

export const useGetUserOrganization = () => {
  const { data } = useQuery({
    ...userQueryKeys.userGetUserMyself,
    select: stableSelectUserOrganization,
    notifyOnChangeProps: ['data'],
  });

  return data;
};

const stableSelectUserOrganizationId = (data: UserResponse | null) => {
  const firstOrganization = data?.organizations?.[0];
  return firstOrganization?.id || null;
};

export const useGetUserOrganizationId = () => {
  const { data } = useQuery({
    ...userQueryKeys.userGetUserMyself,
    select: stableSelectUserOrganizationId,
    notifyOnChangeProps: ['data'],
  });
  return data;
};
