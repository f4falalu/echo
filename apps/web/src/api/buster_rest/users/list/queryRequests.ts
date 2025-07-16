import { QueryClient, useQuery } from '@tanstack/react-query';
import { userQueryKeys } from '@/api/query_keys/users';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { getUserList, getUserList_server } from './requests';

export const useGetUserList = (params: Parameters<typeof getUserList>[0]) => {
  const queryFn = useMemoizedFn(() => getUserList(params));

  return useQuery({
    ...userQueryKeys.userGetUserList(params),
    queryFn
  });
};

export const prefetchGetUserList = async (
  params: Parameters<typeof getUserList>[0],
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();
  await queryClient.prefetchQuery({
    ...userQueryKeys.userGetUserList(params),
    queryFn: () => getUserList_server(params)
  });
  return queryClient;
};
