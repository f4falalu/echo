import React, { useMemo, useRef } from 'react';
import type { ChatSplitterProps } from '../ChatSplitter';
import { ChatHeader } from './ChatHeader';
import { SelectedFile } from '../interfaces';
import { ChatContent } from './ChatContent';
import { useScroll } from 'ahooks';

interface ChatContainerProps {
  chatContent: ChatSplitterProps['chatContent'];
  selectedFile: SelectedFile | undefined;
}

export const ChatContainer: React.FC<ChatContainerProps> = React.memo(
  ({ chatContent, selectedFile }) => {
    const chatContentRef = useRef<HTMLDivElement>(null);
    const scroll = useScroll(chatContentRef);

    const showScrollOverflow = useMemo(() => {
      if (!chatContentRef.current || !scroll) return false;
      const trigger = 50;
      return scroll.top > trigger;
    }, [chatContentRef, scroll?.top]);

    return (
      <div className="flex h-full w-full flex-col">
        <ChatHeader selectedFile={selectedFile} showScrollOverflow={showScrollOverflow} />
        <ChatContent chatContentRef={chatContentRef} />
      </div>
    );
  }
);

ChatContainer.displayName = 'ChatContainer';
