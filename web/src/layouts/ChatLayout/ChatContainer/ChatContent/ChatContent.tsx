'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useChatIndividualContextSelector } from '../../ChatContext';
import { ChatMessageBlock } from './ChatMessageBlock';
import { ChatInput } from './ChatInput';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { CHAT_CONTENT_CONTAINER_ID } from '../ChatContainer';
import { ChatScrollToBottom } from './ChatScrollToBottom';

const autoClass = 'mx-auto max-w-[600px] w-full';

export const ChatContent: React.FC<{}> = React.memo(() => {
  const chatId = useChatIndividualContextSelector((state) => state.chatId);
  const chatMessageIds = useChatIndividualContextSelector((state) => state.chatMessageIds);

  const containerRef = useRef<HTMLElement | null>(null);
  const [autoMessages, setAutoMessages] = useState<string[]>([]);
  const { isAutoScrollEnabled, scrollToBottom } = useAutoScroll(containerRef, {
    observeDeepChanges: true
  });

  useEffect(() => {
    const container = document.getElementById(CHAT_CONTENT_CONTAINER_ID);
    if (!container) return;
    console.log('ADD IN A TODO ABOUT IS COMPLETED STREAM');
    containerRef.current = container;

    setInterval(() => {
      setAutoMessages((prev) => [...prev, 'This is a test ' + prev.length]);
    }, 22220);
  }, []);

  console.log('isAutoScrollEnabled', isAutoScrollEnabled);

  return (
    <>
      <div className="mb-40 flex h-full w-full flex-col overflow-hidden">
        {chatMessageIds?.map((messageId) => (
          <div key={messageId} className={autoClass}>
            <ChatMessageBlock key={messageId} messageId={messageId} chatId={chatId || ''} />
          </div>
        ))}

        <div className="mx-2 flex flex-wrap gap-1 overflow-hidden">
          {autoMessages.map((message, index) => (
            <span key={index} className="w-fit rounded border p-0.5 text-red-700">
              {message}
            </span>
          ))}
        </div>
      </div>

      <ChatInputWrapper>
        <ChatScrollToBottom
          isAutoScrollEnabled={isAutoScrollEnabled}
          scrollToBottom={scrollToBottom}
        />
      </ChatInputWrapper>
    </>
  );
});

ChatContent.displayName = 'ChatContent';

const ChatInputWrapper: React.FC<{
  children?: React.ReactNode;
}> = React.memo(({ children }) => {
  return (
    <div className="bg-page-background absolute bottom-0 w-full">
      <div className="from-page-background pointer-events-none absolute -top-16 h-16 w-full bg-gradient-to-t to-transparent" />
      <div className={autoClass}>
        <ChatInput />
      </div>

      {children}
    </div>
  );
});
