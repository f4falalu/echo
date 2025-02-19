'use client';

import React, { useRef } from 'react';
import { AppSplitter, AppSplitterRef } from '@/components/layout/AppSplitter';
import { ChatContainer } from './ChatContainer';
import { FileContainer } from './FileContainer';
import { ChatLayoutContextProvider } from './ChatLayoutContext';
import { useChatLayout } from './ChatLayoutContext';
import { SelectedFile } from './interfaces';
import { useDefaultSplitterLayout } from './hooks';
import { ChatContextProvider, useChatIndividualContext } from './ChatContext/ChatContext';
import { DEFAULT_CHAT_OPTION } from './ChatLayoutContext/config';

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
    const chatContentRef = useRef<HTMLDivElement>(null);

    const defaultSplitterLayout = useDefaultSplitterLayout({ defaultSelectedLayout });

    const useChatLayoutProps = useChatLayout({
      appSplitterRef,
      defaultSelectedLayout,
      chatId,
      defaultSelectedFile
    });
    const { renderViewLayoutKey, onSetSelectedFile } = useChatLayoutProps;

    const useChatContextValue = useChatIndividualContext({
      chatId,
      defaultSelectedFile,
      onSetSelectedFile
    });

    const { hasFile } = useChatContextValue;

    return (
      <ChatLayoutContextProvider useChatLayoutProps={useChatLayoutProps}>
        <ChatContextProvider value={useChatContextValue}>
          <AppSplitter
            ref={appSplitterRef}
            leftChildren={<ChatContainer ref={chatContentRef} />}
            rightChildren={<FileContainer children={children} />}
            autoSaveId="chat-splitter"
            defaultLayout={defaultSplitterLayout}
            rightHidden={renderViewLayoutKey === 'chat'}
            leftHidden={renderViewLayoutKey === 'file'}
            preserveSide="left"
            leftPanelMinSize={hasFile ? DEFAULT_CHAT_OPTION : undefined}
          />
        </ChatContextProvider>
      </ChatLayoutContextProvider>
    );
  }
);

ChatLayout.displayName = 'ChatLayout';
