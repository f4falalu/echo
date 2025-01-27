import React, { useMemo, useRef } from 'react';
import { ChatHeader } from './ChatHeader';
import { ChatContent } from './ChatContent';
import { useScroll } from 'ahooks';

interface ChatContainerProps {}

export const ChatContainer: React.FC<ChatContainerProps> = React.memo(({}) => {
  const chatContentRef = useRef<HTMLDivElement>(null);
  const scroll = useScroll(chatContentRef);

  const showScrollOverflow = useMemo(() => {
    if (!chatContentRef.current || !scroll) return false;
    const trigger = 25;
    return scroll.top > trigger;
  }, [chatContentRef, scroll?.top]);

  return (
    <div className="flex h-full w-full flex-col">
      <ChatHeader showScrollOverflow={showScrollOverflow} />
      <ChatContent chatContentRef={chatContentRef} />
    </div>
  );
});

ChatContainer.displayName = 'ChatContainer';
