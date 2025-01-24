import React from 'react';
import type { ChatSplitterProps } from '../ChatSplitter';
import { ChatContainerHeader } from './ChatContainerHeader';
import { SelectedFile } from '../interfaces';
import { ChatContainerContentContainer } from './ChatContainerContentContainer';

interface ChatContainerProps {
  chatContent: ChatSplitterProps['chatContent'];
  selectedFile: SelectedFile | undefined;
}

export const ChatContainer: React.FC<ChatContainerProps> = React.memo(
  ({ chatContent, selectedFile }) => {
    return (
      <div className="flex h-full w-full flex-col">
        <ChatContainerHeader selectedFile={selectedFile} />
        <ChatContainerContentContainer />
      </div>
    );
  }
);

ChatContainer.displayName = 'ChatContainer';
