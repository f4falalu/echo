'use client';

import React from 'react';
import { useChatIndividualContextSelector } from '../../ChatContext';
import { ChatMessageBlock } from './ChatMessageBlock';
import { ChatInput } from './ChatInput';

const autoClass = 'mx-auto max-w-[600px] w-full';

export const ChatContent: React.FC<{}> = React.memo(({}) => {
  const chatId = useChatIndividualContextSelector((state) => state.chatId);
  const chatMessageIds = useChatIndividualContextSelector((state) => state.chatMessageIds);

  return (
    <>
      <div className="mb-40 flex h-full w-full flex-col overflow-hidden">
        {chatMessageIds?.map((messageId) => (
          <div key={messageId} className={autoClass}>
            <ChatMessageBlock key={messageId} messageId={messageId} chatId={chatId || ''} />
          </div>
        ))}
      </div>

      <div className="bg-page-background absolute bottom-0 w-full">
        <div className="from-page-background pointer-events-none absolute -top-16 h-16 w-full bg-gradient-to-t to-transparent" />
        <div className={autoClass}>
          <ChatInput />
        </div>
      </div>
    </>
  );
});

ChatContent.displayName = 'ChatContent';
