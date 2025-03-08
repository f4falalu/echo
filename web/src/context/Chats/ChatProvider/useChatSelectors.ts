import type { IBusterChat, IBusterChatMessage } from '@/api/asset_interfaces/chat';
import { useMemoizedFn } from '@/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/query_keys';

export const useChatSelectors = () => {
  const queryClient = useQueryClient();

  const getChatMemoized = useMemoizedFn((chatId: string): IBusterChat | undefined => {
    const options = queryKeys.chatsGetChat(chatId);
    const queryKey = options.queryKey;
    return queryClient.getQueryData<IBusterChat>(queryKey);
  });

  const getChatMessageMemoized = useMemoizedFn((messageId: string) => {
    const options = queryKeys.chatsMessages(messageId);
    const queryKey = options.queryKey;
    return queryClient.getQueryData<IBusterChatMessage>(queryKey);
  });

  return {
    getChatMemoized,
    getChatMessageMemoized
  };
};
