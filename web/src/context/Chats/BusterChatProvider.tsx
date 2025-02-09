import React from 'react';
import { ChatProvider } from './ChatProvider';
import { BusterNewChatProvider } from './NewChatProvider';
import { BusterChatListProvider } from './ChatListProvider';

export const BusterChatProvider = React.memo(({ children }: { children: React.ReactNode }) => {
  return (
    <ChatProvider>
      <BusterNewChatProvider>
        <BusterChatListProvider>{children}</BusterChatListProvider>
      </BusterNewChatProvider>
    </ChatProvider>
  );
});

ChatProvider.displayName = 'ChatProvider';
