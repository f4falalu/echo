import { MutableRefObject } from 'react';
import { useBusterWebSocket } from '../../BusterWebSocket';
import { useMemoizedFn } from 'ahooks';
import type { BusterChat } from '@/api/asset_interfaces';
import type { IBusterChat, IBusterChatMessage } from '../interfaces';
import { updateChatToIChat } from '@/utils/chat';

export const useChatSubscriptions = ({
  chatsRef,
  chatsMessagesRef,
  startTransition
}: {
  chatsRef: MutableRefObject<Record<string, IBusterChat>>;
  chatsMessagesRef: MutableRefObject<Record<string, IBusterChatMessage>>;
  startTransition: (fn: () => void) => void;
}) => {
  const busterSocket = useBusterWebSocket();

  const _onGetChat = useMemoizedFn((chat: BusterChat): IBusterChat => {
    const { iChat, iChatMessages } = updateChatToIChat(chat);

    chatsRef.current[chat.id] = iChat;
    chatsMessagesRef.current = {
      ...chatsMessagesRef.current,
      ...iChatMessages
    };
    startTransition(() => {
      //just used to trigger UI update
    });
    return iChat;
  });

  const unsubscribeFromChat = useMemoizedFn(({ chatId }: { chatId: string }) => {
    return busterSocket.emit({
      route: '/chats/unsubscribe',
      payload: {
        id: chatId
      }
    });
  });

  const subscribeToChat = useMemoizedFn(({ chatId }: { chatId: string }) => {
    return busterSocket.emitAndOnce({
      emitEvent: {
        route: '/chats/get',
        payload: { id: chatId }
      },
      responseEvent: {
        route: '/chats/get:getChat',
        callback: _onGetChat
      }
    });
  });

  return {
    unsubscribeFromChat,
    subscribeToChat
  };
};
