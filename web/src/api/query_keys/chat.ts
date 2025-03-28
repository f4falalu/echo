import { queryOptions } from '@tanstack/react-query';
import type { BusterMetricData } from '@/api/asset_interfaces/metric';
import { IBusterChat, BusterChatListItem, IBusterChatMessage } from '@/api/asset_interfaces/chat';
import { type getListLogs, type getListChats } from '@/api/buster_rest/chats';

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

const chatsGetList = (
  filters?: Omit<Parameters<typeof getListChats>[0], 'page_token' | 'page_size'>
) =>
  queryOptions<BusterChatListItem[]>({
    queryKey: ['chats', 'list', filters] as const,
    staleTime: 60 * 1000, // 1 minute
    initialData: [],
    initialDataUpdatedAt: 0
  });

const chatsBlackBoxMessages = (messageId: string) =>
  queryOptions<string | null>({
    queryKey: ['chats', 'messages', messageId, 'local-only-black-box'] as const,
    staleTime: Infinity,
    enabled: false, //this is local
    queryFn: () => Promise.resolve(null)
  });

const logsGetList = (
  filters?: Omit<Parameters<typeof getListLogs>[0], 'page_token' | 'page_size'>
) =>
  queryOptions<BusterChatListItem[]>({
    queryKey: ['logs', 'list', filters] as const,
    staleTime: 60 * 1000, // 1 minute
    initialData: [],
    initialDataUpdatedAt: 0
  });

export const chatQueryKeys = {
  chatsGetChat,
  chatsGetList,
  chatsMessages,
  chatsMessagesFetchingData,
  chatsBlackBoxMessages,
  logsGetList
};
