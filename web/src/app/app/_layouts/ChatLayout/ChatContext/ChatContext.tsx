import React, { PropsWithChildren } from 'react';
import {
  ContextSelector,
  createContext,
  useContextSelector
} from '@fluentui/react-context-selector';
import { useBusterChatIndividual } from '@/context/Chats';
import type { SelectedFile } from '../interfaces';

export const useChatContext = ({
  chatId,
  defaultSelectedFile
}: {
  chatId?: string;
  defaultSelectedFile?: SelectedFile;
}) => {
  const selectedFileId = defaultSelectedFile?.id;
  const selectedFileType = defaultSelectedFile?.type;
  const metricId = defaultSelectedFile?.type === 'metric' ? defaultSelectedFile?.id : undefined;

  //CHAT
  const { chat } = useBusterChatIndividual({
    chatId,
    metricId
  });
  const hasChat = !!chatId && !!chat;
  const chatTitle = chat?.title;
  const chatMessages = chat?.messages ?? [];

  //FILE
  const hasFile = !!defaultSelectedFile?.id;

  //MESSAGES
  const currentMessageId = chatMessages[chatMessages.length - 1]?.id;

  return {
    hasChat,
    hasFile,
    selectedFileId,
    currentMessageId,
    chatTitle,
    selectedFileType,
    chatMessages,
    chatId
  };
};

export const ChatContext = createContext<ReturnType<typeof useChatContext>>(
  {} as ReturnType<typeof useChatContext>
);

export const ChatContextProvider = React.memo(
  ({ value, children }: PropsWithChildren<{ value: ReturnType<typeof useChatContext> }>) => {
    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
  }
);

ChatContextProvider.displayName = 'ChatContextProvider';

export const useChatContextSelector = <T,>(
  selector: ContextSelector<ReturnType<typeof useChatContext>, T>
) => useContextSelector(ChatContext, selector);
