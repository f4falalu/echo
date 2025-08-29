import React from 'react';
import { useGetActiveChatTitle, useIsStreamingMessage } from '@/context/Chats';
import { useGetChatId } from '@/context/Chats/useGetChatId';
import { ChatHeaderOptions } from './ChatHeaderOptions';
import { ChatHeaderTitle } from './ChatHeaderTitle';

export const ChatHeader: React.FC = React.memo(() => {
  const chatId = useGetChatId();
  const chatTitle = useGetActiveChatTitle();
  const isStreamFinished = useIsStreamingMessage();

  return (
    <>
      <ChatHeaderTitle
        chatTitle={chatTitle || ''}
        chatId={chatId || ''}
        isStreamFinished={isStreamFinished}
      />
      <ChatHeaderOptions />
    </>
  );
});

ChatHeader.displayName = 'ChatContainerHeader';
