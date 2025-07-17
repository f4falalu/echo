import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { organizationQueryKeys } from '@/api/query_keys/organization';
import {
  createOrganization,
  getOrganizationUsers,
  getOrganizationUsers_server,
  updateOrganization
} from './requests';
import { userQueryKeys } from '../../query_keys/users';
import { create } from 'mutative';

export const useGetOrganizationUsers = (organizationId: string) => {
  const queryFn = () => {
    return getOrganizationUsers({ organizationId });
  };

  return useQuery({
    ...organizationQueryKeys.organizationUsers(organizationId),
    queryFn,
    enabled: !!organizationId
  });
};

export const prefetchGetOrganizationUsers = async (
  organizationId: string,
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();
  const queryOptions = organizationQueryKeys.organizationUsers(organizationId);

  await queryClient.prefetchQuery({
    ...queryOptions,
    staleTime: 10 * 1000,
    queryFn: () => getOrganizationUsers_server({ organizationId })
  });
  return queryClient;
};

export const useCreateOrganization = () => {
  return useMutation({
    mutationFn: createOrganization
  });
};

export const useUpdateOrganization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateOrganization,
    onMutate: async (organizationUpdates) => {
      const userQueryKey = userQueryKeys.userGetUserMyself.queryKey;
      queryClient.setQueryData(userQueryKey, (prev) => {
        if (!prev) return prev;

        return create(prev, (draft) => {
          if (
            draft.organizations &&
            Array.isArray(draft.organizations) &&
            draft.organizations.length > 0
          ) {
            Object.assign(draft.organizations[0], organizationUpdates);
          }
        });
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.userGetUserMyself.queryKey });
    }
  });
};
