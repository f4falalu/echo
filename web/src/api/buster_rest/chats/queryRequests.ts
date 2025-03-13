import { useMemoizedFn } from '@/hooks';
import { QueryClient, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getListChats,
  getListChats_server,
  getChat,
  getChat_server,
  updateChat,
  deleteChat,
  getListLogs
} from './requests';
import type { IBusterChat, IBusterChatMessage } from '@/api/asset_interfaces/chat';
import { queryKeys } from '@/api/query_keys';
import { updateChatToIChat } from '@/lib/chat';
import { RustApiError } from '@/api/buster_rest/errors';
import { useMemo } from 'react';

export const useGetListChats = (
  filters?: Omit<Parameters<typeof getListChats>[0], 'page_token' | 'page_size'>
) => {
  const filtersCompiled: Parameters<typeof getListChats>[0] = useMemo(
    () => ({ admin_view: false, page_token: 0, page_size: 3000, ...filters }),
    [filters]
  );

  const queryFn = useMemoizedFn(() => getListChats(filtersCompiled));

  return useQuery({
    ...queryKeys.chatsGetList(filtersCompiled),
    queryFn
  });
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

export const useGetListLogs = (
  filters?: Omit<Parameters<typeof getListLogs>[0], 'page_token' | 'page_size'>
) => {
  const filtersCompiled: Parameters<typeof getListLogs>[0] = useMemo(
    () => ({ page_token: 0, page_size: 3000, ...filters }),
    [filters]
  );

  const queryFn = useMemoizedFn(() => getListLogs(filtersCompiled));

  return useQuery({
    ...queryKeys.logsGetList(filtersCompiled),
    queryFn
  });
};

export const useGetChat = <TData = IBusterChat>(
  params: Parameters<typeof getChat>[0],
  select?: (chat: IBusterChat) => TData
) => {
  const queryClient = useQueryClient();
  const queryFn = useMemoizedFn(() => {
    return getChat(params).then((chat) => {
      const { iChat, iChatMessages } = updateChatToIChat(chat, false);

      iChat.message_ids.forEach((messageId) => {
        queryClient.setQueryData(
          queryKeys.chatsMessages(messageId).queryKey,
          iChatMessages[messageId]
        );
      });

      return iChat;
    });
  });

  useQuery({
    ...queryKeys.chatsGetChat(params.id),
    queryFn,
    enabled: !!params.id
  });

  return useQuery({
    ...queryKeys.chatsGetChat(params.id),
    enabled: !!params.id,
    queryFn,
    select
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

export const useGetChatMemoized = () => {
  const queryClient = useQueryClient();

  const getChatMessageMemoized = useMemoizedFn((messageId: string) => {
    const options = queryKeys.chatsMessages(messageId);
    const queryKey = options.queryKey;
    return queryClient.getQueryData<IBusterChatMessage>(queryKey);
  });

  return getChatMessageMemoized;
};

export const useGetChatMessage = <TData = IBusterChatMessage>(
  messageId: string,
  selector?: (message: IBusterChatMessage) => TData
) => {
  const { data } = useQuery({
    ...queryKeys.chatsMessages(messageId),
    enabled: false, //this will come from the chat
    select: selector
  });
  return data;
};
