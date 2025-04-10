'use client';

import React, { useEffect, useState } from 'react';
import { useChatIndividualContextSelector } from '../../ChatContext';
import { ChatMessageBlock } from './ChatMessageBlock';
import { ChatInput } from './ChatInput';
import ScrollToBottom from 'react-scroll-to-bottom';
import { faker } from '@faker-js/faker';
import { cn } from '@/lib/classMerge';

const autoClass = 'mx-auto max-w-[600px] w-full';

export const ChatContent: React.FC<{}> = React.memo(() => {
  const chatId = useChatIndividualContextSelector((state) => state.chatId);
  const chatMessageIds = useChatIndividualContextSelector((state) => state.chatMessageIds);

  // const [autoMessages, setAutoMessages] = useState<string[]>([]);

  // useEffect(() => {
  //   setInterval(() => {
  //     setAutoMessages((prev) => [...prev, faker.lorem.sentence()]);
  //   }, 1500);
  // }, []);

  return (
    <>
      <div className="mb-40 flex h-full w-full flex-col overflow-hidden">
        {chatMessageIds?.map((messageId) => (
          <div key={messageId} className={autoClass}>
            <ChatMessageBlock key={messageId} messageId={messageId} chatId={chatId || ''} />
          </div>
        ))}

        {/* {autoMessages.map((message, index) => (
          <div key={index} className={cn(autoClass, 'bg-red-300')}>
            <div className="text-red-700">{message}</div>
          </div>
        ))} */}
      </div>

      <ChatInputWrapper />
    </>
  );
});

ChatContent.displayName = 'ChatContent';

const ChatInputWrapper: React.FC = React.memo(() => {
  return (
    <div className="bg-page-background absolute bottom-0 w-full">
      <div className="from-page-background pointer-events-none absolute -top-16 h-16 w-full bg-gradient-to-t to-transparent" />
      <div className={autoClass}>
        <ChatInput />
      </div>
    </div>
  );
});
