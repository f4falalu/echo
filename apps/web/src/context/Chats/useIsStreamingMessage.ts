import { useQueries } from '@tanstack/react-query';
import type { BusterChatMessage } from '@/api/asset_interfaces/chat';
import { chatQueryKeys } from '@/api/query_keys/chat';
import { useGetActiveChat } from './useGetActiveChat';

const stableIsCompleted = (data: BusterChatMessage | undefined) => data?.is_completed;
export const useIsStreamingMessage = () => {
  const chat = useGetActiveChat();
  const chatMessageIds = chat?.message_ids ?? [];
  const isStreamingMessage = useQueries({
    queries: chatMessageIds.map((messageId) => {
      const queryKey = chatQueryKeys.chatsMessages(messageId);
      return {
        ...queryKey,
        enabled: false,
        select: stableIsCompleted,
      };
    }),
    combine: (result) => result.some((res) => res.data === false),
  });
  return isStreamingMessage;
};
