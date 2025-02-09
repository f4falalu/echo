import React, { useRef, useTransition } from 'react';
import {
  createContext,
  ContextSelector,
  useContextSelector
} from '@fluentui/react-context-selector';
import type { BusterChat } from '@/api/asset_interfaces';
import { IBusterChat, IBusterChatMessage } from '../interfaces';
import { useChatSubscriptions } from './useChatSubscriptions';
import { useChatAssosciations } from './useChatAssosciations';
import { useChatSelectors } from './useChatSelectors';
import { useChatUpdate } from './useChatUpdate';

export const useBusterChat = () => {
  const [isPending, startTransition] = useTransition();
  const chatsRef = useRef<Record<string, IBusterChat>>({});
  const chatsMessagesRef = useRef<Record<string, IBusterChatMessage>>({});

  const chatSubscriptions = useChatSubscriptions({
    chatsRef,
    chatsMessagesRef,
    startTransition
  });

  const chatAssociations = useChatAssosciations();

  const chatSelectors = useChatSelectors({
    chatsRef,
    chatsMessagesRef,
    isPending
  });

  const chatUpdate = useChatUpdate({
    chatsRef,
    chatsMessagesRef,
    startTransition
  });

  return {
    chats: chatsRef.current,
    chatsMessages: chatsMessagesRef.current,
    ...chatSubscriptions,
    ...chatAssociations,
    ...chatSelectors,
    ...chatUpdate
  };
};

const BusterChat = createContext<ReturnType<typeof useBusterChat>>(
  {} as ReturnType<typeof useBusterChat>
);

export const ChatProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const value = useBusterChat();

  return <BusterChat.Provider value={value}>{children}</BusterChat.Provider>;
};

export const useBusterChatContextSelector = <T,>(
  selector: ContextSelector<ReturnType<typeof useBusterChat>, T>
) => useContextSelector(BusterChat, selector);
