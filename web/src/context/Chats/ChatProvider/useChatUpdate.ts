import { useBusterWebSocket } from '@/context/BusterWebSocket';
import { useMemoizedFn } from 'ahooks';
import { MutableRefObject } from 'react';
import { IBusterChat, IBusterChatMessage } from '../interfaces';

export const useChatUpdate = ({
  chatsRef,
  startTransition
}: {
  chatsRef: MutableRefObject<Record<string, IBusterChat>>;
  startTransition: (fn: () => void) => void;
}) => {
  const busterSocket = useBusterWebSocket();

  const onUpdateChat = useMemoizedFn(
    async (newChatConfig: Partial<IBusterChat> & { id: string }) => {
      chatsRef.current[newChatConfig.id] = {
        ...chatsRef.current[newChatConfig.id],
        ...newChatConfig
      };
      startTransition(() => {
        //just used to trigger UI update
      });
    }
  );

  const onUpdateChatMessage = useMemoizedFn(
    async (newMessageConfig: Partial<IBusterChatMessage> & { id: string }, chatId: string) => {
      //   chatsRef.current[chatId] = {
      //     ...chatsRef.current[chatId],
      //     messages: chatsRef.current[chatId].messages.map((message) =>
      //       message.id === newMessageConfig.id ? { ...message, ...newMessageConfig } : message
      //     )
      //   };
      startTransition(() => {
        //just used to trigger UI update
      });
    }
  );

  return {
    onUpdateChat,
    onUpdateChatMessage
  };
};
