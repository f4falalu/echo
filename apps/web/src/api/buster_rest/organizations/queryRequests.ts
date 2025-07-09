import { QueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { organizationQueryKeys } from '@/api/query_keys/organization';
import { createOrganization, getOrganizationUsers, getOrganizationUsers_server } from './requests';

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
