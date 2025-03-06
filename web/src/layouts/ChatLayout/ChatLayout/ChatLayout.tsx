'use client';

import React, { useRef } from 'react';
import { AppSplitter, AppSplitterRef } from '@/components/ui/layouts/AppSplitter';
import { ChatContainer } from '../ChatContainer';
import { FileContainer } from '../FileContainer';
import { ChatLayoutContextProvider } from '../ChatLayoutContext';
import { useChatLayout } from '../ChatLayoutContext';
import { useDefaultSplitterLayout, useSelectedFileByParams } from '../hooks';
import { ChatContextProvider, useChatIndividualContext } from '../ChatContext/ChatContext';
import { DEFAULT_CHAT_OPTION_SIDEBAR_SIZE } from '../ChatLayoutContext/config';

interface ChatSplitterProps {
  showChatCollapse?: boolean;
  children?: React.ReactNode;
}

export const ChatLayout: React.FC<ChatSplitterProps> = React.memo(({ children }) => {
  const appSplitterRef = useRef<AppSplitterRef>(null);

  const { selectedFile, selectedLayout, chatId } = useSelectedFileByParams();

  const defaultSplitterLayout = useDefaultSplitterLayout({ selectedLayout });

  const useChatLayoutProps = useChatLayout({
    appSplitterRef,
    selectedFile,
    selectedLayout,
    chatId
  });
  const { renderViewLayoutKey, onSetSelectedFile } = useChatLayoutProps;

  const useChatContextValue = useChatIndividualContext({
    chatId,
    selectedFile,
    onSetSelectedFile
  });

  const { hasFile } = useChatContextValue;

  console.log('renderViewLayoutKey', renderViewLayoutKey);

  return (
    <ChatLayoutContextProvider useChatLayoutProps={useChatLayoutProps}>
      <ChatContextProvider value={useChatContextValue}>
        <AppSplitter
          ref={appSplitterRef}
          leftChildren={<ChatContainer />}
          rightChildren={<FileContainer>{children || <div>No children?</div>}</FileContainer>}
          autoSaveId="chat-splitter"
          defaultLayout={defaultSplitterLayout}
          rightHidden={false}
          leftHidden={renderViewLayoutKey === 'file'}
          preserveSide="left"
          leftPanelMinSize={hasFile ? DEFAULT_CHAT_OPTION_SIDEBAR_SIZE : undefined}
        />
      </ChatContextProvider>
    </ChatLayoutContextProvider>
  );
});

ChatLayout.displayName = 'ChatLayout';
