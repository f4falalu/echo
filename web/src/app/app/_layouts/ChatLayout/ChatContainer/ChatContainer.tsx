import React, { useMemo, useRef } from 'react';
import type { ChatSplitterProps } from '../ChatLayout';
import { ChatHeader } from './ChatHeader';
import { SelectedFile } from '../interfaces';
import { ChatContent } from './ChatContent';
import { useScroll } from 'ahooks';

interface ChatContainerProps {
  chatContent: ChatSplitterProps['chatContent'];
  selectedFile: SelectedFile | undefined;
  isPureFile: boolean;
}

export const ChatContainer: React.FC<ChatContainerProps> = React.memo(
  ({ chatContent, selectedFile, isPureFile }) => {
    const chatContentRef = useRef<HTMLDivElement>(null);
    const scroll = useScroll(chatContentRef);

    const showScrollOverflow = useMemo(() => {
      if (!chatContentRef.current || !scroll) return false;
      const trigger = 50;
      return scroll.top > trigger;
    }, [chatContentRef, scroll?.top]);

    if (isPureFile) return null;

    return (
      <div className="flex h-full w-full flex-col">
        <ChatHeader selectedFile={selectedFile} showScrollOverflow={showScrollOverflow} />
        <ChatContent chatContentRef={chatContentRef} />
      </div>
    );
  }
);

ChatContainer.displayName = 'ChatContainer';
