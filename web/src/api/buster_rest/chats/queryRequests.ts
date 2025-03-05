import { useCreateReactQuery } from '@/api/createReactQuery';
import { useMemoizedFn } from 'ahooks';
import { QueryClient } from '@tanstack/react-query';
import { getListChats, getListChats_server, getChat, getChat_server } from './requests';
import type { BusterChatListItem } from '@/api/asset_interfaces';
import { queryKeys } from '@/api/query_keys';
import { updateChatToIChat } from '@/lib/chat';

export const useGetListChats = (params?: Parameters<typeof getListChats>[0]) => {
  const queryFn = useMemoizedFn((): Promise<BusterChatListItem[]> => {
    return getListChats(params);
  });

  const res = useCreateReactQuery({
    ...queryKeys.chatsGetList(params),
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
    ...queryKeys.chatsGetList(params),
    queryFn: () => getListChats_server(params)
  });

  return queryClient;
};

export const useGetChat = (params: Parameters<typeof getChat>[0]) => {
  const queryFn = useMemoizedFn(async () => {
    return await getChat(params).then((chat) => {
      return updateChatToIChat(chat, true).iChat;
    });
  });

  return useCreateReactQuery({
    ...queryKeys.chatsGetChat(params.id),
    queryFn,
    enabled: !!params.id
  });
};

export const prefetchGetChat = async (
  params: Parameters<typeof getChat>[0],
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();

  await queryClient.prefetchQuery({
    ...queryKeys.chatsGetChat(params.id),
    queryFn: async () => {
      return await getChat_server(params).then((chat) => {
        return updateChatToIChat(chat, true).iChat;
      });
    }
  });

  return queryClient;
};
