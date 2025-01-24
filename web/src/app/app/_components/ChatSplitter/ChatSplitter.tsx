import React, { useMemo, useRef } from 'react';
import { AppSplitter, AppSplitterRef } from '@/components/layout/AppSplitter';
import { ChatContainer } from './ChatContainer';
import { FileContainer } from './FileContainer';
import { ChatSplitterContextProvider } from './ChatSplitterContext';
import { useChatSplitter } from './ChatSplitterContext';
import { SelectedFile } from './interfaces';

export interface ChatSplitterProps {
  chatHeaderOptions?: [];
  chatContent?: React.ReactNode;
  showChatCollapse?: boolean;
  defaultShowLayout?: 'chat' | 'file' | 'both';
  defaultSelectedFile?: SelectedFile;
}

export const ChatSplitter: React.FC<ChatSplitterProps> = React.memo(
  ({ defaultSelectedFile, defaultShowLayout = 'chat', chatHeaderOptions, chatContent }) => {
    const appSplitterRef = useRef<AppSplitterRef>(null);

    const defaultLayout = useMemo(() => {
      if (defaultShowLayout === 'chat') {
        return ['100%', '0%'];
      }
      if (defaultShowLayout === 'file') {
        return ['0%', '100%'];
      }
      return ['325px', 'auto'];
    }, [defaultShowLayout]);

    const useChatSplitterProps = useChatSplitter({
      defaultSelectedFile,
      appSplitterRef
    });
    const { selectedFile, hasFile } = useChatSplitterProps;

    return (
      <ChatSplitterContextProvider useChatSplitterProps={useChatSplitterProps}>
        <AppSplitter
          ref={appSplitterRef}
          leftChildren={<ChatContainer selectedFile={selectedFile} chatContent={chatContent} />}
          rightChildren={<FileContainer selectedFile={selectedFile} />}
          autoSaveId="chat-splitter"
          defaultLayout={defaultLayout}
          preserveSide="left"
          rightHidden={!hasFile}
          leftPanelMaxSize={hasFile ? 600 : undefined}
        />
      </ChatSplitterContextProvider>
    );
  }
);

ChatSplitter.displayName = 'ChatSplitter';
