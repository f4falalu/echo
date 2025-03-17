'use client';

import React from 'react';
import { ChatHeaderOptions } from './ChatHeaderOptions';
import { ChatHeaderTitle } from './ChatHeaderTitle';
import { useChatIndividualContextSelector } from '../../ChatContext';

export const ChatHeader: React.FC<{}> = React.memo(({}) => {
  const chatTitle = useChatIndividualContextSelector((state) => state.chatTitle);

  if (!chatTitle) return null;

  return (
    <>
      <ChatHeaderTitle chatTitle={chatTitle || ''} />
      <ChatHeaderOptions />
    </>
  );
});

ChatHeader.displayName = 'ChatContainerHeader';
