'use client';

import { ClientOnly } from '@tanstack/react-router';
import React, { useRef } from 'react';
import { ScrollToBottomButton } from '@/components/features/buttons/ScrollToBottomButton';
import { useGetChatMessageIds } from '@/context/Chats';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { useMount } from '@/hooks/useMount';
import { cn } from '@/lib/utils';
import { CHAT_CONTAINER_ID } from '../ChatContainer';
import { ChatInput } from './ChatInput';
import { ChatMessageBlock } from './ChatMessageBlock';

const autoClass = 'mx-auto max-w-[600px] w-full';

export const ChatContent: React.FC<{ chatId: string | undefined }> = React.memo(({ chatId }) => {
  const chatMessageIds = useGetChatMessageIds(chatId);
  const containerRef = useRef<HTMLElement>(null);

  const { isAutoScrollEnabled, scrollToBottom, enableAutoScroll } = useAutoScroll(containerRef, {
    observeSubTree: true,
    enabled: false,
  });

  useMount(() => {
    const container = document
      .getElementById(CHAT_CONTAINER_ID)
      ?.querySelector('.scroll-area-viewport') as HTMLElement;
    if (!container) return;
    containerRef.current = container;
    enableAutoScroll();
  });

  return (
    <ClientOnly>
      <div className="mb-48 flex h-full w-full flex-col">
        {chatMessageIds?.map((messageId, index) => (
          <div key={messageId} className={autoClass}>
            <ChatMessageBlock
              key={messageId}
              messageId={messageId}
              chatId={chatId || ''}
              messageIndex={index}
            />
          </div>
        ))}
      </div>

      <ChatInputWrapper>
        <ScrollToBottomButton
          isAutoScrollEnabled={isAutoScrollEnabled}
          scrollToBottom={scrollToBottom}
        />
      </ChatInputWrapper>
    </ClientOnly>
  );
});

ChatContent.displayName = 'ChatContent';

const ChatInputWrapper: React.FC<{
  children?: React.ReactNode;
}> = ({ children }) => {
  return (
    <div className="bg-page-background absolute bottom-0 w-full overflow-visible">
      <div className="from-page-background pointer-events-none absolute -top-16 h-16 w-full bg-gradient-to-t to-transparent" />
      <div className={cn(autoClass, 'relative')}>
        <ChatInput />
        {children}
      </div>
    </div>
  );
};

ChatInputWrapper.displayName = 'ChatInputWrapper';
