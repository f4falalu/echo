'use client';

import React, { useMemo, useRef, useState } from 'react';
import { AppSplitter, AppSplitterRef } from '@/components/layout/AppSplitter';
import { ChatContainer } from './ChatContainer';
import { FileContainer } from './FileContainer';
import { ChatSplitterContextProvider } from './ChatLayoutContext';
import { useChatLayout } from './ChatLayoutContext';
import { SelectedFile } from './interfaces';
import { useDefaultSplitterLayout } from './hooks';
import { ChatContextProvider, useChatContext } from './ChatContext/ChatContext';

export interface ChatSplitterProps {
  showChatCollapse?: boolean;
  defaultSelectedFile?: SelectedFile;
  defaultSelectedLayout?: 'chat' | 'file' | 'both';
  children?: React.ReactNode;
  chatId: string | undefined;
}

export const ChatLayout: React.FC<ChatSplitterProps> = React.memo(
  ({ defaultSelectedFile, defaultSelectedLayout = 'chat', children, chatId }) => {
    const appSplitterRef = useRef<AppSplitterRef>(null);

    const defaultSplitterLayout = useDefaultSplitterLayout({ defaultSelectedLayout });

    const useChatSplitterProps = useChatLayout({
      appSplitterRef,
      defaultSelectedFile,
      defaultSelectedLayout,
      chatId
    });

    const useChatContextValue = useChatContext({ chatId, defaultSelectedFile });

    const { isPureChat, isPureFile } = useChatSplitterProps;
    const { hasFile } = useChatContextValue;

    return (
      <ChatSplitterContextProvider useChatSplitterProps={useChatSplitterProps}>
        <ChatContextProvider value={useChatContextValue}>
          <AppSplitter
            ref={appSplitterRef}
            leftChildren={isPureFile ? null : <ChatContainer />}
            rightChildren={<FileContainer children={children} />}
            autoSaveId="chat-splitter"
            defaultLayout={defaultSplitterLayout}
            rightHidden={isPureChat}
            preserveSide="left"
            leftPanelMinSize={hasFile ? 225 : undefined}
          />
        </ChatContextProvider>
      </ChatSplitterContextProvider>
    );
  }
);

ChatLayout.displayName = 'ChatLayout';
