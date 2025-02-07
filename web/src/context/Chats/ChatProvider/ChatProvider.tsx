import React, { useEffect, useRef, useTransition } from 'react';
import {
  createContext,
  ContextSelector,
  useContextSelector
} from '@fluentui/react-context-selector';
import type { BusterChat } from '@/api/asset_interfaces';
import { useUnmount } from 'ahooks';
import { IBusterChat } from '../interfaces';
import { SelectedFile } from '@/app/app/_layouts/ChatLayout';
import { useChatSubscriptions } from './useChatSubscriptions';
import { useChatAssosciations } from './useChatAssosciations';
import { useFileFallback } from './helpers';

export const useBusterChat = () => {
  const [isPending, startTransition] = useTransition();
  const chatsRef = useRef<Record<string, IBusterChat>>({});

  const { unsubscribeFromChat, subscribeToChat } = useChatSubscriptions({
    chatsRef,
    startTransition
  });

  const { onDeleteChat } = useChatAssosciations();

  return {
    chats: chatsRef.current,
    unsubscribeFromChat,
    subscribeToChat,
    onDeleteChat
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
  chatId,
  defaultSelectedFile
}: {
  chatId?: string;
  defaultSelectedFile?: SelectedFile;
}) => {
  const chat: IBusterChat | undefined = useBusterChatContextSelector((x) => x.chats[chatId || '']);
  const subscribeToChat = useBusterChatContextSelector((x) => x.subscribeToChat);
  const unsubscribeFromChat = useBusterChatContextSelector((x) => x.unsubscribeFromChat);

  const memoizedFallbackToMetricChat = useFileFallback({
    defaultSelectedFile
  });

  const selectedChat: IBusterChat = chat || memoizedFallbackToMetricChat;

  useEffect(() => {
    if (chatId) subscribeToChat({ chatId });
  }, [chatId]);

  useUnmount(() => {
    if (chatId) unsubscribeFromChat({ chatId });
  });

  return {
    chat: selectedChat
  };
};
