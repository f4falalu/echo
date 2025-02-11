import { type MutableRefObject, useCallback } from 'react';
import type { IBusterChat, IBusterChatMessage } from '../interfaces';
import { useMemoizedFn } from 'ahooks';

export const useChatSelectors = ({
  isPending,
  chatsRef,
  chatsMessagesRef
}: {
  isPending: boolean;
  chatsRef: MutableRefObject<Record<string, IBusterChat>>;
  chatsMessagesRef: MutableRefObject<Record<string, IBusterChatMessage>>;
}) => {
  const getChatMemoized = useMemoizedFn((chatId: string): IBusterChat | undefined => {
    return chatsRef.current[chatId];
  });

  const getChatMessages = useCallback(
    (chatId: string): IBusterChatMessage[] => {
      return getChatMessagesMemoized(chatId);
    },
    [chatsMessagesRef, isPending, chatsRef]
  );

  const getChatMessage = useCallback(
    (messageId: string): IBusterChatMessage | undefined => {
      return getChatMessageMemoized(messageId);
    },
    [chatsMessagesRef, isPending]
  );

  const getChatMessagesMemoized = useMemoizedFn((chatId: string) => {
    const chatMessageIds = chatsRef.current[chatId].messages || [];
    return chatMessageIds.map((messageId) => chatsMessagesRef.current[messageId]);
  });

  const getChatMessageMemoized = useMemoizedFn((messageId: string) => {
    return chatsMessagesRef.current[messageId];
  });

  return {
    getChatMemoized,
    getChatMessages,
    getChatMessage,
    getChatMessagesMemoized,
    getChatMessageMemoized
  };
};
