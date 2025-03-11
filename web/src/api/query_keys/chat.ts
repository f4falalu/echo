import { queryOptions } from '@tanstack/react-query';
import type { BusterMetricData } from '@/api/asset_interfaces/metric';
import { IBusterChat, BusterChatListItem, IBusterChatMessage } from '@/api/asset_interfaces/chat';
import type { GetChatListParams } from '@/api/request_interfaces/chats';

const chatsGetChat = (chatId: string) =>
  queryOptions<IBusterChat>({
    queryKey: ['chats', 'get', chatId] as const,
    enabled: !!chatId,
    staleTime: 60 * 1000 // 1 minute
  });

const chatsMessages = (messageId: string) =>
  queryOptions<IBusterChatMessage>({
    queryKey: ['chats', 'messages', messageId] as const,
    staleTime: Infinity,
    enabled: !!messageId
  });

const chatsMessagesFetchingData = (messageId: string) =>
  queryOptions<BusterMetricData>({
    queryKey: ['chats', 'messages-data', messageId] as const,
    staleTime: Infinity,
    enabled: !!messageId
  });

const chatsGetList = (filters?: GetChatListParams) =>
  queryOptions<BusterChatListItem[]>({
    queryKey: ['chats', 'list', filters] as const,
    staleTime: 10 * 1000,
    initialData: []
  });

const chatsBlackBoxMessages = (messageId: string) =>
  queryOptions<string | null>({
    queryKey: ['chats', 'messages', messageId, 'black-box'] as const,
    staleTime: Infinity,
    enabled: false,
    queryFn: () => Promise.resolve(null)
  });

export const chatQueryKeys = {
  chatsGetChat,
  chatsGetList,
  chatsMessages,
  chatsMessagesFetchingData,
  chatsBlackBoxMessages
};
