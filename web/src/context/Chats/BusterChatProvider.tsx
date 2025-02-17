import React from 'react';
import { ChatProvider } from './ChatProvider';
import { BusterNewChatProvider } from './NewChatProvider';

export const BusterChatProvider = React.memo(({ children }: { children: React.ReactNode }) => {
  return (
    <ChatProvider>
      <BusterNewChatProvider>{children}</BusterNewChatProvider>
    </ChatProvider>
  );
});

BusterChatProvider.displayName = 'ChatProvider';
