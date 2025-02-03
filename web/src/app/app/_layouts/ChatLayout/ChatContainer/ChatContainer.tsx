import React, { useMemo, useRef } from 'react';
import { ChatHeader } from './ChatHeader';
import { ChatContent } from './ChatContent';
import { useScroll } from 'ahooks';

interface ChatContainerProps {}

export const ChatContainer = React.memo(
  React.forwardRef<HTMLDivElement, ChatContainerProps>((props, ref) => {
    const chatContentRef = useRef<HTMLDivElement>(null);
    const scroll = useScroll(chatContentRef);

    const showScrollOverflow = useMemo(() => {
      if (!chatContentRef.current || !scroll) return false;
      const trigger = 25;
      return scroll.top > trigger;
    }, [chatContentRef, scroll?.top]);

    return (
      <div ref={ref} className="flex h-full w-full min-w-[225px] flex-col">
        <ChatHeader showScrollOverflow={showScrollOverflow} />
        <ChatContent chatContentRef={chatContentRef} />
      </div>
    );
  })
);

ChatContainer.displayName = 'ChatContainer';
