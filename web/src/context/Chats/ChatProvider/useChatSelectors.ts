import type { IBusterChat, IBusterChatMessage } from '../interfaces';
import { useMemoizedFn } from 'ahooks';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/query_keys';

export const useChatSelectors = () => {
  const queryClient = useQueryClient();

  const getChatMemoized = useMemoizedFn((chatId: string): IBusterChat | undefined => {
    const options = queryKeys.chatsGetChat(chatId);
    const queryKey = options.queryKey;
    return queryClient.getQueryData<IBusterChat>(queryKey);
  });

  const getChatMessagesMemoized = useMemoizedFn((chatId: string) => {
    const chatMessageIds = getChatMemoized(chatId)?.messages || [];
    return chatMessageIds.map((messageId) => getChatMessageMemoized(messageId));
  });

  const getChatMessageMemoized = useMemoizedFn((messageId: string) => {
    const options = queryKeys['chatsMessages'](messageId);
    const queryKey = options.queryKey;
    return queryClient.getQueryData<IBusterChatMessage>(queryKey);
  });

  return {
    getChatMemoized,
    getChatMessagesMemoized,
    getChatMessageMemoized
  };
};
