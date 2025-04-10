import React from 'react';
import { ChatHeader } from './ChatHeader';
import { ChatContent } from './ChatContent';
import { AppPageLayout } from '@/components/ui/layouts';

export const CHAT_CONTENT_CONTAINER_ID = 'chat-container-content';

export const ChatContainer = React.memo(() => {
  return (
    <AppPageLayout
      contentContainerId={CHAT_CONTENT_CONTAINER_ID}
      header={<ChatHeader />}
      headerBorderVariant="ghost"
      scrollable
      className="flex h-full w-full min-w-[295px] flex-col">
      <ChatContent />
    </AppPageLayout>
  );
});

ChatContainer.displayName = 'ChatContainer';
