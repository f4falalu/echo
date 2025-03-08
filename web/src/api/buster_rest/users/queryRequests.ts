import { useMutation, useQuery } from '@tanstack/react-query';
import {
  getUser,
  getUser_server,
  updateOrganizationUser,
  getMyUserInfo,
  getMyUserInfo_server
} from './requests';
import { useMemoizedFn } from '@/hooks';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/query_keys';

export const useGetMyUserInfo = () => {
  const queryFn = useMemoizedFn(async () => {
    return getMyUserInfo();
  });
  return useQuery({
    ...queryKeys.userGetUserMyself,
    queryFn,
    enabled: false //This is a server only query
  });
};

export const prefetchGetMyUserInfo = async (
  params: Parameters<typeof getMyUserInfo_server>[0],
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();
  const initialData = await getMyUserInfo_server(params);
  await queryClient.prefetchQuery({
    ...queryKeys.userGetUserMyself,
    queryFn: () => initialData!,
    initialData
  });
  return { queryClient, initialData };
};

export const useGetUser = (params: Parameters<typeof getUser>[0]) => {
  const queryFn = useMemoizedFn(() => getUser(params));

  return useQuery({
    ...queryKeys.userGetUser(params.userId),
    queryFn
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const mutationFn = useMemoizedFn(async (params: Parameters<typeof updateOrganizationUser>[0]) => {
    const options = queryKeys.userGetUser(params.userId);
    queryClient.setQueryData(options.queryKey, (oldData) => {
      return {
        ...oldData!,
        ...params
      };
    });
    const res = await updateOrganizationUser(params);
    return res;
  });

  return useMutation({
    mutationFn: mutationFn
  });
};

export const prefetchGetUser = async (userId: string, queryClientProp?: QueryClient) => {
  const queryClient = queryClientProp || new QueryClient();
  await queryClient.prefetchQuery({
    ...queryKeys.userGetUser(userId),
    queryFn: () => getUser_server({ userId })
  });
  return queryClient;
};
