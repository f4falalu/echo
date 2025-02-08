import { useCreateReactQuery } from '@/api/createReactQuery';
import { useMemoizedFn } from 'ahooks';
import { QueryClient } from '@tanstack/react-query';
import { getListChats, getListChats_server, getChat, getChat_server } from './requests';
import type { BusterChatListItem, BusterChat } from '@/api/asset_interfaces';

export const useGetListChats = (params?: Parameters<typeof getListChats>[0]) => {
  const queryFn = useMemoizedFn(() => {
    return getListChats(params);
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

export const prefetchGetListChats = async (
  params?: Parameters<typeof getListChats>[0],
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['chats', 'list', params || {}],
    queryFn: () => getListChats_server(params)
  });

  return queryClient;
};

export const useGetChat = (params: Parameters<typeof getChat>[0]) => {
  const queryFn = useMemoizedFn(() => {
    return getChat(params);
  });

  return useCreateReactQuery<BusterChat>({
    queryKey: ['chats', 'get', params.id],
    queryFn
  });
};

export const prefetchGetChat = async (
  params: Parameters<typeof getChat>[0],
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['chats', 'get', params.id],
    queryFn: () => getChat_server(params)
  });

  return queryClient;
};
