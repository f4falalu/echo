import React, { PropsWithChildren } from 'react';
import {
  ContextSelector,
  createContext,
  useContextSelector
} from '@fluentui/react-context-selector';
import type { SelectedFile } from '../interfaces';
import { useSubscribeIndividualChat } from './useSubscribeIndividualChat';
import { useAutoChangeLayout } from './useAutoChangeLayout';
import { useBusterChatContextSelector } from '@/context/Chats';

export const useChatIndividualContext = ({
  chatId,
  defaultSelectedFile,
  onSetSelectedFile
}: {
  chatId?: string;
  defaultSelectedFile?: SelectedFile;
  onSetSelectedFile: (file: SelectedFile) => void;
}) => {
  const selectedFileId = defaultSelectedFile?.id;
  const selectedFileType = defaultSelectedFile?.type;

  //CHAT
  const chat = useSubscribeIndividualChat({
    chatId,
    defaultSelectedFile
  });

  const hasChat = !!chatId && !!chat;
  const chatTitle = chat?.title;
  const chatMessageIds = chat?.messages ?? [];

  //FILE
  const hasFile = !!defaultSelectedFile?.id;

  //MESSAGES
  const currentMessageId = chatMessageIds[chatMessageIds.length - 1];
  const isLoading = useBusterChatContextSelector(
    (x) => x.chatsMessages[currentMessageId]?.isCompletedStream
  );

  useAutoChangeLayout({ lastMessageId: currentMessageId, onSetSelectedFile });

  return {
    hasChat,
    hasFile,
    selectedFileId,
    currentMessageId,
    chatTitle,
    selectedFileType,
    chatMessageIds,
    chatId,
    isLoading
  };
};

export const IndividualChatContext = createContext<ReturnType<typeof useChatIndividualContext>>(
  {} as ReturnType<typeof useChatIndividualContext>
);

export const ChatContextProvider = React.memo(
  ({
    value,
    children
  }: PropsWithChildren<{ value: ReturnType<typeof useChatIndividualContext> }>) => {
    return (
      <IndividualChatContext.Provider value={value}>{children}</IndividualChatContext.Provider>
    );
  }
);

ChatContextProvider.displayName = 'ChatContextProvider';

export const useChatIndividualContextSelector = <T,>(
  selector: ContextSelector<ReturnType<typeof useChatIndividualContext>, T>
) => useContextSelector(IndividualChatContext, selector);
