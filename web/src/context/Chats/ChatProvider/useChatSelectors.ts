import { MutableRefObject, useCallback } from 'react';
import { IBusterChat, IBusterChatMessage } from '../interfaces';

export const useChatSelectors = ({
  isPending,
  chatsRef,
  chatsMessagesRef
}: {
  isPending: boolean;
  chatsRef: MutableRefObject<Record<string, IBusterChat>>;
  chatsMessagesRef: MutableRefObject<Record<string, IBusterChatMessage>>;
}) => {
  const getChatMessages = useCallback(
    (chatId: string): IBusterChatMessage[] => {
      const chatMessageIds = chatsRef.current[chatId].messages || [];
      return chatMessageIds.map((messageId) => chatsMessagesRef.current[messageId]);
    },
    [chatsMessagesRef, isPending, chatsRef]
  );

  const getChatMessage = useCallback(
    (messageId: string): IBusterChatMessage => {
      return chatsMessagesRef.current[messageId];
    },
    [chatsMessagesRef, isPending]
  );

  return { getChatMessages, getChatMessage };
};
