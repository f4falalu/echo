import { MutableRefObject } from 'react';
import { useBusterWebSocket } from '../../BusterWebSocket';
import { useMemoizedFn } from 'ahooks';
import {
  BusterChat,
  BusterChatMessage,
  BusterChatMessageReasoning_thought
} from '@/api/asset_interfaces';
import { IBusterChat, IBusterChatMessage } from '../interfaces';
import { chatMessageUpgrader, chatUpgrader } from './helpers';
import {
  createMockResponseMessageFile,
  createMockResponseMessageText,
  createMockResponseMessageThought,
  MOCK_CHAT
} from './MOCK_CHAT';
import { useHotkeys } from 'react-hotkeys-hook';

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
    const upgradedChat = chatUpgrader(chat);
    const upgradedChatMessages = chatMessageUpgrader(chat.messages);
    chatsRef.current[chat.id] = upgradedChat;
    chatsMessagesRef.current = {
      ...chatsMessagesRef.current,
      ...upgradedChatMessages
    };
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
