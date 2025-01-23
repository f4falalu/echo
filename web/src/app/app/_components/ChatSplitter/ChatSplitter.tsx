import React, { useEffect, useMemo, useRef } from 'react';
import { AppSplitter, AppSplitterRef } from '@/components/layout/AppSplitter';
import { AppChatMessageFileType } from '@/components/messages/AppChatMessageContainer';
import { ChatContainer } from './ChatContainer';
import { FileContainer } from './FileContainer';
import { useUpdateEffect } from 'ahooks';
import { ChatSplitterContextProvider } from './ChatSplitterContext';
import { useChatSplitter } from './ChatSplitterContext/useChatSplitter';
import { SelectedFile } from './interfaces';

export interface ChatSplitterProps {
  chatHeaderText: string;
  chatHeaderOptions?: [];
  chatContent?: React.ReactNode;
  fileHeader?: React.ReactNode;
  defaultShowFile?: boolean;
  defaultSelectedFile?: SelectedFile;
}

export const ChatSplitter: React.FC<ChatSplitterProps> = React.memo(
  ({ chatHeaderText, defaultShowFile = false, defaultSelectedFile }) => {
    const appSplitterRef = useRef<AppSplitterRef>(null);

    const defaultLayout = useMemo(() => {
      return defaultShowFile ? ['20%', '80%'] : ['100%', '0%'];
    }, [defaultShowFile]);

    const useChatSplitterProps = useChatSplitter({ defaultSelectedFile, appSplitterRef });
    const { selectedFile, hasFile } = useChatSplitterProps;

    return (
      <ChatSplitterContextProvider useChatSplitterProps={useChatSplitterProps}>
        <AppSplitter
          ref={appSplitterRef}
          leftChildren={<ChatContainer chatHeaderText={chatHeaderText} />}
          rightChildren={<FileContainer selectedFile={selectedFile} />}
          autoSaveId="chat-splitter"
          defaultLayout={defaultLayout}
          preserveSide="left"
          rightHidden={!hasFile}
        />
      </ChatSplitterContextProvider>
    );
  }
);

ChatSplitter.displayName = 'ChatSplitter';
