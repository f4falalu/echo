import { MutableRefObject } from 'react';
import { useBusterWebSocket } from '../../BusterWebSocket';
import { useMemoizedFn } from 'ahooks';
import { BusterChat } from '@/api/asset_interfaces';
import { IBusterChat } from '../interfaces';
import { chatUpgrader } from './helpers';
import { MOCK_CHAT } from './MOCK_CHAT';

export const useChatSubscriptions = ({
  chatsRef,
  startTransition
}: {
  chatsRef: MutableRefObject<Record<string, IBusterChat>>;
  startTransition: (fn: () => void) => void;
}) => {
  const busterSocket = useBusterWebSocket();

  const _onGetChat = useMemoizedFn((chat: BusterChat): IBusterChat => {
    const upgradedChat = chatUpgrader(chat);
    chatsRef.current[chat.id] = upgradedChat;
    startTransition(() => {
      //just used to trigger UI update
    });
    return upgradedChat;
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
    _onGetChat(MOCK_CHAT);
    // return busterSocket.emitAndOnce({
    //   emitEvent: {
    //     route: '/chats/get',
    //     payload: { id: chatId }
    //   },
    //   responseEvent: {
    //     route: '/chats/get:getChat',
    //     callback: _onGetChat
    //   }
    // });
  });

  return {
    unsubscribeFromChat,
    subscribeToChat
  };
};
