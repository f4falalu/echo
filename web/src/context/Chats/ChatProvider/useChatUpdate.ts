import { useBusterWebSocket } from '@/context/BusterWebSocket';
import { useMemoizedFn } from 'ahooks';
import { type MutableRefObject } from 'react';
import type { IBusterChat, IBusterChatMessage } from '../interfaces';

export const useChatUpdate = ({
  chatsRef,
  chatsMessagesRef,
  startTransition
}: {
  chatsRef: MutableRefObject<Record<string, IBusterChat>>;
  chatsMessagesRef: MutableRefObject<Record<string, IBusterChatMessage>>;
  startTransition: (fn: () => void) => void;
}) => {
  const busterSocket = useBusterWebSocket();

  const onUpdateChat = useMemoizedFn(
    async (newChatConfig: Partial<IBusterChat> & { id: string }, saveToServer: boolean = false) => {
      chatsRef.current[newChatConfig.id] = {
        ...chatsRef.current[newChatConfig.id],
        ...newChatConfig
      };
      startTransition(() => {
        //just used to trigger UI update

        if (saveToServer) {
          const { title, is_favorited, id } = chatsRef.current[newChatConfig.id];
          busterSocket.emit({
            route: '/chats/update',
            payload: {
              id,
              title,
              is_favorited
            }
          });
        }
      });
    }
  );

  const onUpdateChatMessage = useMemoizedFn(
    async (newMessageConfig: Partial<IBusterChatMessage> & { id: string }) => {
      chatsMessagesRef.current[newMessageConfig.id] = {
        ...chatsMessagesRef.current[newMessageConfig.id],
        ...newMessageConfig
      };
      startTransition(() => {
        //just used to trigger UI update
      });
    }
  );

  const onBulkSetChatMessages = useMemoizedFn(
    (newMessagesConfig: Record<string, IBusterChatMessage>) => {
      chatsMessagesRef.current = {
        ...chatsMessagesRef.current,
        ...newMessagesConfig
      };
      startTransition(() => {
        //just used to trigger UI update
      });
    }
  );

  return {
    onUpdateChat,
    onUpdateChatMessage,
    onBulkSetChatMessages
  };
};
