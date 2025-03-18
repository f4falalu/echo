'use client';

import React, { useMemo, useRef } from 'react';
import { AppSplitter, AppSplitterRef } from '@/components/ui/layouts/AppSplitter';
import { ChatContainer } from '../ChatContainer';
import { FileContainer } from '../FileContainer';
import { ChatLayoutContextProvider } from '../ChatLayoutContext';
import { useChatLayout } from '../ChatLayoutContext';
import { ChatContextProvider } from '../ChatContext/ChatContext';
import { DEFAULT_CHAT_OPTION_SIDEBAR_SIZE } from '../ChatLayoutContext/config';

interface ChatSplitterProps {
  children?: React.ReactNode;
}

export const ChatLayout: React.FC<ChatSplitterProps> = ({ children }) => {
  const appSplitterRef = useRef<AppSplitterRef>(null);

  const useChatLayoutProps = useChatLayout({ appSplitterRef });
  const { renderViewLayoutKey, selectedLayout, selectedFile, onSetSelectedFile, chatId } =
    useChatLayoutProps;

  const defaultSplitterLayout = useMemo(() => {
    if (selectedLayout === 'chat') return ['100%', '0%'];
    if (selectedLayout === 'file') return ['0%', '100%'];
    return ['380px', 'auto'];
  }, [selectedLayout]);

  const rightHidden = renderViewLayoutKey === 'chat';
  const leftHidden = renderViewLayoutKey === 'file';

  return (
    <ChatLayoutContextProvider useChatLayoutProps={useChatLayoutProps}>
      <ChatContextProvider
        chatId={chatId}
        selectedFile={selectedFile}
        onSetSelectedFile={onSetSelectedFile}>
        <AppSplitter
          ref={appSplitterRef}
          leftChildren={<ChatContainer />}
          rightChildren={<FileContainer>{children}</FileContainer>}
          autoSaveId="chat-splitter"
          defaultLayout={defaultSplitterLayout}
          rightHidden={rightHidden}
          leftHidden={leftHidden}
          preserveSide="left"
          leftPanelMinSize={selectedFile ? DEFAULT_CHAT_OPTION_SIDEBAR_SIZE : undefined}
        />
      </ChatContextProvider>
    </ChatLayoutContextProvider>
  );
};

ChatLayout.displayName = 'ChatLayout';
