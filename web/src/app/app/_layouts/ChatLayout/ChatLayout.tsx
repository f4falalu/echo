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
  selectedLayout?: 'chat' | 'file' | 'both';
  selectedFile?: SelectedFile;
}

export const ChatLayout: React.FC<ChatSplitterProps> = React.memo(
  ({ selectedFile, selectedLayout = 'chat' }) => {
    const appSplitterRef = useRef<AppSplitterRef>(null);
    const [isPureFile, setIsPureFile] = useState(selectedLayout === 'file');

    const defaultSplitterLayout = useMemo(() => {
      if (selectedLayout === 'chat') return ['100%', '0%'];
      if (selectedLayout === 'file') return ['0%', '100%'];
      return ['325px', 'auto'];
    }, [selectedLayout]);

    const useChatSplitterProps = useChatLayout({ selectedFile });
    const { onSetSelectedFile, hasFile } = useChatSplitterProps;

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

      if (selectedFile) onSetSelectedFile(selectedFile);
    }, [selectedFile, selectedLayout]);

    useUpdateLayoutEffect(() => {
      if (isPureFile === true) setIsPureFile(selectedLayout === 'file');
    }, [selectedLayout]);

    return (
      <ChatSplitterContextProvider useChatSplitterProps={useChatSplitterProps}>
        <AppSplitter
          ref={appSplitterRef}
          leftChildren={isPureFile ? null : <ChatContainer />}
          rightChildren={<FileContainer />}
          autoSaveId="chat-splitter"
          defaultLayout={defaultSplitterLayout}
          preserveSide="left"
          leftPanelMaxSize={hasFile ? 625 : undefined}
          leftPanelMinSize={hasFile ? 250 : undefined}
          rightPanelMinSize={450}
        />
      </ChatSplitterContextProvider>
    );
  }
);

ChatLayout.displayName = 'ChatSplitter';
