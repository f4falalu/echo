import { useMemoizedFn } from '@/hooks';
import { QueryClient, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getListChats,
  getListChats_server,
  getChat,
  getChat_server,
  updateChat,
  deleteChat
} from './requests';
import type { BusterChatListItem, IBusterChat } from '@/api/asset_interfaces/chat';
import { queryKeys } from '@/api/query_keys';
import { updateChatToIChat } from '@/lib/chat';
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
      console.log('TODO move this to put message in a better spot');
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
        console.log('TODO move this to put message in a better spot');
        return updateChatToIChat(chat, true).iChat;
      });
    }
  });

  return queryClient;
};

export const useUpdateChat = () => {
  return useMutation({
    mutationFn: updateChat,
    onMutate: () => {
      //this is actually handled in @useChatUpdate file
    }
  });
};

export const useDeleteChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteChat,
    onSuccess(data, variables, context) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.chatsGetList().queryKey
      });
    }
  });
};
