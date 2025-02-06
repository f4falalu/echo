import React, { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import {
  createContext,
  ContextSelector,
  useContextSelector
} from '@fluentui/react-context-selector';
import { useBusterWebSocket } from '../BusterWebSocket';
import type { BusterChat } from '@/api/asset_interfaces';
import { useMemoizedFn, useUnmount } from 'ahooks';
import { createMockResponseMessageThought, MOCK_CHAT } from './MOCK_CHAT';
import { IBusterChat } from './interfaces';
import { chatUpgrader } from './helpers';
import { useHotkeys } from 'react-hotkeys-hook';
import { useFileFallback } from './helpers/useFileFallback';
import { SelectedFile } from '@/app/app/_layouts/ChatLayout';

export const useBusterChat = () => {
  const busterSocket = useBusterWebSocket();
  const [isPending, startTransition] = useTransition();
  const chatsRef = useRef<Record<string, IBusterChat>>({});
  const [prompt, setPrompt] = useState('');

  // GETTERS

  // SETTERS

  // LISTENERS

  const _onGetChat = useMemoizedFn((chat: BusterChat): IBusterChat => {
    const upgradedChat = chatUpgrader(chat);
    chatsRef.current[chat.id] = upgradedChat;
    startTransition(() => {
      //just used to trigger UI update
    });
    return upgradedChat;
  });

  // EMITTERS

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
    const chatId = Object.keys(chatsRef.current)[0];
    if (chatId) {
      const chat = chatsRef.current[chatId];
      const mockMessage = createMockResponseMessageThought();
      const newChat = { ...chat };
      const firstMessage = {
        ...newChat.messages[0],
        isCompletedStream: false,
        response_messages: [...newChat.messages[0].response_messages, mockMessage]
      };
      newChat.messages = [firstMessage];
      chatsRef.current[chatId] = newChat;
      startTransition(() => {
        //just used to trigger UI update
      });
    }
  });

  return {
    chats: chatsRef.current,
    unsubscribeFromChat,
    subscribeToChat
  };
};

const BusterChat = createContext<ReturnType<typeof useBusterChat>>(
  {} as ReturnType<typeof useBusterChat>
);

export const BusterChatProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const value = useBusterChat();

  return <BusterChat.Provider value={value}>{children}</BusterChat.Provider>;
};

export const useBusterChatContextSelector = <T,>(
  selector: ContextSelector<ReturnType<typeof useBusterChat>, T>
) => useContextSelector(BusterChat, selector);

export const useBusterChatIndividual = ({
  chatId: chatIdProp,
  defaultSelectedFile
}: {
  chatId?: string;
  defaultSelectedFile?: SelectedFile;
}) => {
  const chatId = chatIdProp || '';
  const chat: IBusterChat | undefined = useBusterChatContextSelector((x) => x.chats[chatId]);
  const subscribeToChat = useBusterChatContextSelector((x) => x.subscribeToChat);
  const unsubscribeFromChat = useBusterChatContextSelector((x) => x.unsubscribeFromChat);

  const memoizedFallbackToMetricChat = useFileFallback({
    defaultSelectedFile
  });

  useEffect(() => {
    if (chatId) subscribeToChat({ chatId });
  }, [chatId]);

  useUnmount(() => {
    if (chatId) unsubscribeFromChat({ chatId });
  });

  const selectedChat: IBusterChat = chat || memoizedFallbackToMetricChat;

  return {
    chat: selectedChat
  };
};
