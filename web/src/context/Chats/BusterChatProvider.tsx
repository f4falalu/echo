import React from 'react';
import { ChatProvider } from './ChatProvider';
import { BusterNewChatProvider } from './NewChatProvider';
import { BusterChatListProvider } from './ChatListProvider';

export const BusterChatProvider = React.memo(({ children }: { children: React.ReactNode }) => {
  return (
    <ChatProvider>
      <BusterChatListProvider>
        <BusterNewChatProvider>{children}</BusterNewChatProvider>
      </BusterChatListProvider>
    </ChatProvider>
  );
});

BusterChatProvider.displayName = 'ChatProvider';
