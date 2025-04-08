'use client';

import React, { useMemo, useRef } from 'react';
import { AppSplitter, AppSplitterRef } from '@/components/ui/layouts/AppSplitter';
import { ChatContainer } from '../ChatContainer';
import { FileContainer } from '../FileContainer';
import { ChatLayoutContextProvider, useChatLayoutContext } from '../ChatLayoutContext';
import { ChatContextProvider } from '../ChatContext/ChatContext';
import { DEFAULT_CHAT_OPTION_SIDEBAR_SIZE } from '../ChatLayoutContext/config';

interface ChatSplitterProps {
  children?: React.ReactNode;
}

export const ChatLayout: React.FC<ChatSplitterProps> = ({ children }) => {
  const appSplitterRef = useRef<AppSplitterRef>(null);
  const chatLayoutProps = useChatLayoutContext({ appSplitterRef });
  const { selectedLayout, selectedFile } = chatLayoutProps;

  const defaultSplitterLayout = useMemo(() => {
    if (selectedLayout === 'chat') return ['100%', '0%'];
    if (selectedLayout === 'file') return ['0%', '100%'];
    return ['380px', 'auto'];
  }, [selectedLayout]);

  return (
    <ChatLayoutContextProvider chatLayoutProps={chatLayoutProps}>
      <ChatContextProvider>
        <AppSplitter
          ref={appSplitterRef}
          leftChildren={useMemo(
            () => (
              <ChatContainer />
            ),
            []
          )}
          rightChildren={useMemo(
            () => (
              <FileContainer>{children}</FileContainer>
            ),
            [children]
          )}
          autoSaveId="chat-splitter"
          defaultLayout={defaultSplitterLayout}
          allowResize={selectedLayout === 'both'}
          preserveSide="left"
          leftPanelMinSize={selectedFile ? DEFAULT_CHAT_OPTION_SIDEBAR_SIZE : undefined}
        />
      </ChatContextProvider>
    </ChatLayoutContextProvider>
  );
};

ChatLayout.displayName = 'ChatLayout';
