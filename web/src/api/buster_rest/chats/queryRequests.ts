import { useMemoizedFn } from 'ahooks';
import { QueryClient, useQuery } from '@tanstack/react-query';
import { getListChats, getListChats_server, getChat, getChat_server } from './requests';
import type { BusterChatListItem } from '@/api/asset_interfaces';
import { queryKeys } from '@/api/query_keys';
import { updateChatToIChat } from '@/lib/chat';
import type { IBusterChat } from '@/context/Chats';
import { RustApiError } from '@/api/buster_rest/errors';

export const useGetListChats = (params?: Parameters<typeof getListChats>[0]) => {
  const queryFn = useMemoizedFn((): Promise<BusterChatListItem[]> => {
    return getListChats(params);
  });

  const res = useQuery({
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

  useQuery({
    ...queryKeys.chatsGetChat(params.id),
    queryFn,
    enabled: !!params.id
  });

  return useQuery<IBusterChat, RustApiError>({
    ...queryKeys.chatsGetChat(params.id),
    queryKey: queryKeys.chatsGetChat(params.id).queryKey,
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
