import { useQuery } from '@tanstack/react-query';
import { userQueryKeys } from '@/api/query_keys/users';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { getUserToOrganization } from './requests';

export const useGetUserToOrganization = (params: Parameters<typeof getUserToOrganization>[0]) => {
  const queryFn = useMemoizedFn(() => getUserToOrganization(params));

  return useQuery({
    ...userQueryKeys.userGetUserToOrganization(params),
    queryFn
  });
};
