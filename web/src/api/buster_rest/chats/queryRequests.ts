import { useMemoizedFn } from '@/hooks';
import { QueryClient, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getListChats,
  getListChats_server,
  getChat,
  getChat_server,
  updateChat,
  deleteChat,
  getListLogs,
  duplicateChat
} from './requests';
import type { IBusterChat, IBusterChatMessage } from '@/api/asset_interfaces/chat';
import { queryKeys } from '@/api/query_keys';
import { updateChatToIChat } from '@/lib/chat';
import { useMemo } from 'react';
import last from 'lodash/last';
import { prefetchGetMetricDataClient } from '../metrics/queryRequests';

export const useGetListChats = (
  filters?: Omit<Parameters<typeof getListChats>[0], 'page_token' | 'page_size'>
) => {
  const filtersCompiled: Parameters<typeof getListChats>[0] = useMemo(
    () => ({ admin_view: false, page_token: 0, page_size: 3000, ...filters }),
    [filters]
  );

  const queryFn = useMemoizedFn(() => getListChats(filtersCompiled));

  return useQuery({
    ...queryKeys.chatsGetList(filters),
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
    ...queryKeys.logsGetList(filters),
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

      const lastMessageId = last(iChat.message_ids);
      const lastMessage = iChatMessages[lastMessageId!];
      if (lastMessage) {
        Object.values(lastMessage.response_messages).forEach((responseMessage) => {
          prefetchGetMetricDataClient({ id: responseMessage.id }, queryClient);
        });
      }

      iChat.message_ids.forEach((messageId) => {
        queryClient.setQueryData(
          queryKeys.chatsMessages(messageId).queryKey,
          iChatMessages[messageId]
        );
      });

      return iChat;
    });
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
        return updateChatToIChat(chat, true).iChat;
      });
    }
  });

  return queryClient;
};

export const useUpdateChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateChat,
    onMutate: (data) => {
      //this is actually handled in @useChatUpdate file

      //except for the chat title and feedback
      if (data.title || data.feedback !== undefined) {
        const options = queryKeys.chatsGetChat(data.id);
        queryClient.setQueryData(options.queryKey, (old) => {
          return {
            ...old!,
            ...data
          };
        });
      }
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

export const useDuplicateChat = () => {
  return useMutation({
    mutationFn: duplicateChat
  });
};
