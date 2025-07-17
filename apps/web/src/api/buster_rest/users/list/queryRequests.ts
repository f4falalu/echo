import { keepPreviousData, useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { userQueryKeys } from '@/api/query_keys/users';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { getUserToOrganization } from './requests';
import type { GetUserToOrganizationResponse } from '@buster/server-shared/user';
import type { RustApiError } from '../../errors';

export const useGetUserToOrganization = <TData = GetUserToOrganizationResponse>(
  params: Parameters<typeof getUserToOrganization>[0],
  options?: Omit<
    UseQueryOptions<GetUserToOrganizationResponse, RustApiError, TData>,
    'queryKey' | 'queryFn'
  >
) => {
  const queryFn = useMemoizedFn(() => getUserToOrganization(params));

  return useQuery({
    ...userQueryKeys.userGetUserToOrganization(params),
    placeholderData: keepPreviousData,
    queryFn,
    select: options?.select,
    ...options
  });
};
