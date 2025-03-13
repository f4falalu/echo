import React from 'react';
import { BusterNewChatProvider } from './NewChatProvider';

export const BusterChatProvider = React.memo(({ children }: { children: React.ReactNode }) => {
  return <BusterNewChatProvider>{children}</BusterNewChatProvider>;
});

BusterChatProvider.displayName = 'ChatProvider';
