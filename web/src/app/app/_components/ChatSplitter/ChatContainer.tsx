import React from 'react';
import type { ChatSplitterProps } from './ChatSplitter';

interface ChatContainerProps {
  chatHeaderText: string;
  chatHeaderOptions: ChatSplitterProps['chatHeaderOptions'];
  chatContent: ChatSplitterProps['chatContent'];
}

export const ChatContainer: React.FC<ChatContainerProps> = React.memo(({ chatHeaderText }) => {
  return (
    <div className="h-full w-full bg-red-500">
      {/* <Button onClick={onToggleClick}>Toggle {toggleClose.toString()}</Button> */}
    </div>
  );
});

ChatContainer.displayName = 'ChatContainer';
