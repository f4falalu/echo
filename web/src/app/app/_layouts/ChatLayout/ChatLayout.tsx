'use client';

import React, { useMemo, useRef, useState } from 'react';
import { AppSplitter, AppSplitterRef } from '@/components/layout/AppSplitter';
import { ChatContainer } from './ChatContainer';
import { FileContainer } from './FileContainer';
import { ChatSplitterContextProvider } from './ChatLayoutContext';
import { useChatLayout } from './ChatLayoutContext';
import { SelectedFile } from './interfaces';
import { useUpdateEffect, useUpdateLayoutEffect } from 'ahooks';

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
    const [isPureFile, setIsPureFile] = useState(defaultSelectedLayout === 'file');

    const defaultSplitterLayout = useMemo(() => {
      if (defaultSelectedLayout === 'chat') return ['100%', '0%'];
      if (defaultSelectedLayout === 'file') return ['0%', '100%'];
      return ['325px', 'auto'];
    }, [defaultSelectedLayout]);

    const useChatSplitterProps = useChatLayout({
      appSplitterRef,
      defaultSelectedFile,
      defaultSelectedLayout,
      chatId
    });
    const { onSetSelectedFile, selectedFileType, selectedLayout, hasFile } = useChatSplitterProps;

    useUpdateEffect(() => {
      if (appSplitterRef.current) {
        const { animateWidth, isSideClosed } = appSplitterRef.current;
        if (selectedLayout === 'chat') {
          animateWidth('100%', 'left');
        } else if (selectedLayout === 'file') {
          animateWidth('100%', 'right');
        } else if (selectedLayout === 'both' && (isSideClosed('right') || isSideClosed('left'))) {
          animateWidth('320px', 'left');
        }
      }
    }, [selectedLayout]);

    useUpdateLayoutEffect(() => {
      if (isPureFile === true) setIsPureFile(selectedLayout === 'file');
    }, [selectedLayout]);

    return (
      <ChatSplitterContextProvider useChatSplitterProps={useChatSplitterProps}>
        <AppSplitter
          ref={appSplitterRef}
          leftChildren={isPureFile ? null : <ChatContainer />}
          rightChildren={<FileContainer children={children} />}
          autoSaveId="chat-splitter"
          defaultLayout={defaultSplitterLayout}
          preserveSide="left"
          leftPanelMinSize={hasFile ? 250 : undefined}
        />
      </ChatSplitterContextProvider>
    );
  }
);

ChatLayout.displayName = 'ChatSplitter';
