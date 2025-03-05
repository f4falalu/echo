import { queryOptions } from '@tanstack/react-query';
import type { BusterChatListItem } from '@/api/asset_interfaces';
import type { GetChatListParams } from '@/api/request_interfaces/chats';
import { IBusterChat, IBusterChatMessage } from '@/context/Chats';
import { BusterMetricData } from '@/context/MetricData';

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
    staleTime: 10 * 1000
  });

export const chatQueryKeys = {
  chatsGetChat,
  chatsGetList,
  chatsMessages,
  chatsMessagesFetchingData
};
