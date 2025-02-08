import { MutableRefObject } from 'react';
import { useBusterWebSocket } from '../../BusterWebSocket';
import { useMemoizedFn } from 'ahooks';
import { BusterChat } from '@/api/asset_interfaces';
import { IBusterChat } from '../interfaces';
import { chatUpgrader } from './helpers';
import {
  createMockResponseMessageFile,
  createMockResponseMessageText,
  createMockResponseMessageThought,
  MOCK_CHAT
} from './MOCK_CHAT';
import { useHotkeys } from 'react-hotkeys-hook';

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

  useHotkeys('t', () => {
    const newThoughts = createMockResponseMessageThought();
    const myChat = {
      ...chatsRef.current[MOCK_CHAT.id]!,
      messages: [
        {
          ...chatsRef.current[MOCK_CHAT.id]!.messages[0],
          reasoning: [...chatsRef.current[MOCK_CHAT.id]!.messages[0].reasoning, newThoughts],
          isCompletedStream: false
        }
      ]
    };

    chatsRef.current[MOCK_CHAT.id] = myChat;

    startTransition(() => {
      // Create a new reference to trigger React update
      chatsRef.current = { ...chatsRef.current };
    });
  });

  useHotkeys('m', () => {
    const newTextMessage = createMockResponseMessageText();
    const myChat = {
      ...chatsRef.current[MOCK_CHAT.id]!,
      messages: [
        {
          ...chatsRef.current[MOCK_CHAT.id]!.messages[0],
          response_messages: [
            ...chatsRef.current[MOCK_CHAT.id]!.messages[0]!.response_messages,
            newTextMessage
          ],
          isCompletedStream: false
        }
      ]
    };

    chatsRef.current[MOCK_CHAT.id] = myChat;

    startTransition(() => {
      chatsRef.current = { ...chatsRef.current };
    });
  });

  useHotkeys('f', () => {
    const newFileMessage = createMockResponseMessageFile();
    const myChat = {
      ...chatsRef.current[MOCK_CHAT.id]!,
      messages: [
        {
          ...chatsRef.current[MOCK_CHAT.id]!.messages[0],
          response_messages: [
            ...chatsRef.current[MOCK_CHAT.id]!.messages[0]!.response_messages,
            newFileMessage
          ],
          isCompletedStream: false
        }
      ]
    };

    chatsRef.current[MOCK_CHAT.id] = myChat;

    startTransition(() => {
      chatsRef.current = { ...chatsRef.current };
    });
  });

  return {
    unsubscribeFromChat,
    subscribeToChat
  };
};
