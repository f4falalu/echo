import { useCreateReactQuery } from '@/api/createReactQuery';
import { useMemoizedFn } from 'ahooks';
import { QueryClient } from '@tanstack/react-query';
import { getChats, getChats_server } from './requests';
import type { BusterChatListItem } from '@/api/asset_interfaces';

export const useGetChats = (params?: Parameters<typeof getChats>[0]) => {
  const queryFn = useMemoizedFn(() => {
    return getChats(params);
  });

  const res = useCreateReactQuery<BusterChatListItem[]>({
    queryKey: ['chats', 'list', params || {}],
    queryFn
  });

  return {
    ...res,
    data: res.data || []
  };
};

export const prefetchGetChats = async (
  params?: Parameters<typeof getChats>[0],
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['chats', 'list', params || {}],
    queryFn: () => getChats_server(params)
  });

  return queryClient;
};
