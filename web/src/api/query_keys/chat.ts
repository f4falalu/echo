import { queryOptions } from '@tanstack/react-query';
import type { BusterChatListItem } from '@/api/asset_interfaces';
import type { GetChatListParams } from '@/api/request_interfaces/chats';
import { IBusterChat, IBusterChatMessage } from '@/context/Chats';

const chatsGetChat = (chatId: string) =>
  queryOptions<IBusterChat>({
    queryKey: ['chats', 'get', chatId] as const,
    staleTime: 60 * 1000 // 1 minute
  });

const chatsMessages = (messageId: string) =>
  queryOptions<IBusterChatMessage>({
    queryKey: ['chats', 'messages', messageId] as const,
    staleTime: Infinity
  });

const chatsGetList = (filters?: GetChatListParams) =>
  queryOptions<BusterChatListItem[]>({
    queryKey: ['chats', 'list', filters] as const,
    staleTime: 10 * 1000
  });

export const chatQueryKeys = {
  chatsGetChat,
  chatsGetList,
  chatsMessages
};
