import React from 'react';
import { AppPageLayout } from '@/components/ui/layouts/AppPageLayout';
import { ChatContent } from './ChatContent';
import { ChatHeader } from './ChatHeader';

export const CHAT_CONTAINER_ID = 'chat-container-content';

export const ChatContainer = React.memo(({ chatId }: { chatId: string | undefined }) => {
  return (
    <AppPageLayout
      headerSizeVariant="default"
      header={<ChatHeader />}
      headerBorderVariant="ghost"
      scrollable
      id={CHAT_CONTAINER_ID}
      className="chat-container-content flex h-full w-full min-w-[295px] flex-col"
    >
      <ChatContent chatId={chatId} />
    </AppPageLayout>
  );
});

ChatContainer.displayName = 'ChatContainer';
