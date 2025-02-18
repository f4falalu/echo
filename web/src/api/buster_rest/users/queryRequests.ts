import {
  PREFETCH_STALE_TIME,
  useCreateReactMutation,
  useCreateReactQuery
} from '@/api/createReactQuery';
import {
  getUser,
  getUser_server,
  updateOrganizationUser,
  getMyUserInfo,
  getMyUserInfo_server
} from './requests';
import { useMemoizedFn } from 'ahooks';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/query_keys';
import { BusterUserResponse } from '@/api/asset_interfaces';

export const useGetMyUserInfo = () => {
  const queryFn = useMemoizedFn(async () => getMyUserInfo());
  return useCreateReactQuery({
    queryKey: queryKeys['/users/response:getUserMyself'].queryKey,
    queryFn,
    staleTime: PREFETCH_STALE_TIME,
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
    ...queryKeys['/users/response:getUserMyself'],
    initialData
  });
  return { queryClient, initialData };
};

export const useGetUser = (params: Parameters<typeof getUser>[0]) => {
  const queryFn = useMemoizedFn(() => getUser(params));

  return useCreateReactQuery({
    queryKey: queryKeys['/users/response:getUser'](params.userId).queryKey,
    queryFn,
    staleTime: PREFETCH_STALE_TIME
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const mutationFn = useMemoizedFn(async (params: Parameters<typeof updateOrganizationUser>[0]) => {
    const options = queryKeys['/users/response:getUser'](params.userId);
    queryClient.setQueryData(options.queryKey, (oldData) => {
      return {
        ...oldData!,
        ...params
      };
    });
    const res = await updateOrganizationUser(params);
    return res;
  });

  return useCreateReactMutation({
    mutationFn: mutationFn
  });
};

export const prefetchGetUser = async (userId: string, queryClientProp?: QueryClient) => {
  const queryClient = queryClientProp || new QueryClient();
  await queryClient.prefetchQuery({
    ...queryKeys['/users/response:getUser'](userId),
    queryFn: () => getUser_server({ userId })
  });
  return queryClient;
};
