import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { BusterChatMessage } from '@/api/asset_interfaces/chat';
import { chatQueryKeys } from '@/api/query_keys/chat';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';

export const useReasoningIsCompleted = (messageId: string) => {
  const queryKey = useMemo(() => chatQueryKeys.chatsMessages(messageId), [messageId]);
  const reasoningIsCompleted = useQueries({
    queries: useMemo(
      () => [
        {
          ...queryKey,
          enabled: false,
          select: (x: BusterChatMessage | undefined) => ({
            is_completed: x?.is_completed,
            final_reasoning_message: x?.final_reasoning_message,
          }),
        },
      ],
      [queryKey]
    ),
    combine: useMemoizedFn((result) => {
      const { data } = result[0];
      return data?.final_reasoning_message || data?.is_completed;
    }),
  });

  return reasoningIsCompleted;
};
