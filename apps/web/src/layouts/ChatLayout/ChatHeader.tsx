import React from 'react';
import { ChatHeaderOptions } from '@/components/features/chat/ChatHeaderOptions';
import { ChatHeaderTitle } from '@/components/features/chat/ChatHeaderTitle';
import { useGetActiveChatTitle, useIsStreamingMessage } from '@/context/Chats';
import { useGetChatId } from '@/context/Chats/useGetChatId';

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
