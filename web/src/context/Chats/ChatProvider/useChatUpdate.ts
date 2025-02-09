import { useBusterWebSocket } from '@/context/BusterWebSocket';
import { useMemoizedFn } from 'ahooks';
import { MutableRefObject } from 'react';
import { IBusterChat, IBusterChatMessage } from '../interfaces';

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

  return {
    onUpdateChat,
    onUpdateChatMessage
  };
};
