'use client';

import React from 'react';
import { ChatHeaderOptions } from './ChatHeaderOptions';
import { ChatHeaderTitle } from './ChatHeaderTitle';
import { useChatIndividualContextSelector } from '../../ChatContext';

export const ChatHeader: React.FC<{
  showScrollOverflow: boolean;
}> = React.memo(({ showScrollOverflow }) => {
  const hasFile = useChatIndividualContextSelector((state) => state.hasFile);
  const chatTitle = useChatIndividualContextSelector((state) => state.chatTitle);

  if (!hasFile && !chatTitle) return null;

  return (
    <>
      <ChatHeaderTitle />
      <ChatHeaderOptions />
    </>
  );
});

ChatHeader.displayName = 'ChatContainerHeader';
