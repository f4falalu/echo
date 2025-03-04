import React, { useMemo, useRef } from 'react';
import { ChatHeader } from './ChatHeader';
import { ChatContent } from './ChatContent';
import { useScroll } from 'ahooks';
import { AppPageLayout } from '@/components/ui/layouts';

interface ChatContainerProps {}

export const ChatContainer = React.memo(({}: ChatContainerProps) => {
  const chatContentRef = useRef<HTMLDivElement>(null);
  const scroll = useScroll(chatContentRef);

  const showScrollOverflow = useMemo(() => {
    if (!chatContentRef.current || !scroll) return false;
    const trigger = 25;
    return scroll.top > trigger;
  }, [chatContentRef, scroll?.top]);

  return (
    <AppPageLayout
      header={<ChatHeader showScrollOverflow={showScrollOverflow} />}
      headerBorderVariant="ghost"
      className="flex h-full w-full min-w-[295px] flex-col">
      <ChatContent chatContentRef={chatContentRef} />
    </AppPageLayout>
  );
});

ChatContainer.displayName = 'ChatContainer';
