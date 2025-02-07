import React, { PropsWithChildren } from 'react';
import {
  ContextSelector,
  createContext,
  useContextSelector
} from '@fluentui/react-context-selector';
import { useBusterChatIndividual } from '@/context/Chats';
import type { SelectedFile } from '../interfaces';

export const useChatIndividualContext = ({
  chatId,
  defaultSelectedFile
}: {
  chatId?: string;
  defaultSelectedFile?: SelectedFile;
}) => {
  const selectedFileId = defaultSelectedFile?.id;
  const selectedFileType = defaultSelectedFile?.type;

  //CHAT
  const { chat } = useBusterChatIndividual({
    chatId,
    defaultSelectedFile
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
