import type { GetUserToOrganizationResponse } from '@buster/server-shared/user';
import { keepPreviousData, type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { userQueryKeys } from '@/api/query_keys/users';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import type { RustApiError } from '../../../errors';
import { getUserToOrganization } from './requests';

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
    ...options,
  });
};
