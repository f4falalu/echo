import React from 'react';
import { ChatHeader } from './ChatHeader';
import { ChatContent } from './ChatContent';
import { AppPageLayout } from '@/components/ui/layouts';

export const ChatContainer = React.memo(() => {
  return (
    <AppPageLayout
      header={<ChatHeader />}
      headerBorderVariant="ghost"
      scrollable
      className="flex h-full w-full min-w-[295px] flex-col"
      //  mainClassName="max-w-[calc(100%_-_12px)]"
    >
      <ChatContent />
    </AppPageLayout>
  );
});

ChatContainer.displayName = 'ChatContainer';
