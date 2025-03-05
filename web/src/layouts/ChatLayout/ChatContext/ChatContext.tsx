import React, { PropsWithChildren } from 'react';
import {
  ContextSelector,
  createContext,
  useContextSelector
} from '@fluentui/react-context-selector';
import type { SelectedFile } from '../interfaces';
import { useAutoChangeLayout } from './useAutoChangeLayout';
import { useMessageIndividual } from '@/context/Chats';
import { useGetChat } from '@/api/buster_rest/chats';

export const useChatIndividualContext = ({
  chatId,
  selectedFile,
  onSetSelectedFile
}: {
  chatId?: string;
  selectedFile?: SelectedFile;
  onSetSelectedFile: (file: SelectedFile) => void;
}) => {
  const selectedFileId = selectedFile?.id;
  const selectedFileType = selectedFile?.type;

  //CHAT
  const { data: chat } = useGetChat({ id: chatId || '' });

  const hasChat = !!chatId && !!chat;
  const chatTitle = chat?.title;
  const chatMessageIds = chat?.message_ids ?? [];

  //FILE
  const hasFile = !!selectedFileId;

  //MESSAGES
  const currentMessageId = chatMessageIds[chatMessageIds.length - 1];
  const isLoading = useMessageIndividual(currentMessageId, (x) => !x?.isCompletedStream);

  useAutoChangeLayout({
    lastMessageId: currentMessageId,
    onSetSelectedFile
  });

  return React.useMemo(
    () => ({
      hasChat,
      hasFile,
      selectedFileId,
      currentMessageId,
      chatTitle,
      selectedFileType,
      chatMessageIds,
      chatId,
      isLoading
    }),
    [
      hasChat,
      hasFile,
      selectedFileId,
      currentMessageId,
      chatTitle,
      selectedFileType,
      chatMessageIds,
      chatId,
      isLoading
    ]
  );
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
