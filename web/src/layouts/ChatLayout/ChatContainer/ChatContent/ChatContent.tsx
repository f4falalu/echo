'use client';

import React from 'react';
import { useChatIndividualContextSelector } from '../../ChatContext';
import { ChatMessageBlock } from './ChatMessageBlock';
import { ChatInput } from './ChatInput';

const autoClass = 'mx-auto max-w-[600px] w-full';

export const ChatContent: React.FC<{}> = React.memo(({}) => {
  const chatMessageIds = useChatIndividualContextSelector((state) => state.chatMessageIds);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="h-full w-full overflow-y-auto">
        <div className="pb-8">
          {chatMessageIds?.map((messageId) => (
            <div key={messageId} className={autoClass}>
              <ChatMessageBlock key={messageId} messageId={messageId} />
            </div>
          ))}
        </div>
      </div>
      <div className={autoClass}>
        <ChatInput />
      </div>
    </div>
  );
});

ChatContent.displayName = 'ChatContent';
