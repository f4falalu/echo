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
  chatContent?: React.ReactNode;
  showChatCollapse?: boolean;
  defaultShowLayout?: 'chat' | 'file' | 'both';
  defaultSelectedFile?: SelectedFile;
}

export const ChatLayout: React.FC<ChatSplitterProps> = React.memo(
  ({ defaultSelectedFile, defaultShowLayout = 'chat', chatContent }) => {
    const appSplitterRef = useRef<AppSplitterRef>(null);
    const [isPureFile, setIsPureFile] = useState(defaultShowLayout === 'file');

    const defaultSplitterLayout = useMemo(() => {
      if (defaultShowLayout === 'chat') return ['100%', '0%'];
      if (defaultShowLayout === 'file') return ['0%', '100%'];
      return ['325px', 'auto'];
    }, [defaultShowLayout]);

    const useChatSplitterProps = useChatLayout({ defaultSelectedFile });
    const { onSetSelectedFile, selectedFile, hasFile } = useChatSplitterProps;

    useUpdateEffect(() => {
      if (defaultSelectedFile && appSplitterRef.current) {
        if (defaultShowLayout === 'chat') {
          appSplitterRef.current?.animateWidth('100%', 'left');
        } else if (defaultShowLayout === 'file') {
          appSplitterRef.current?.animateWidth('100%', 'right');
        } else if (appSplitterRef.current.isRightClosed || appSplitterRef.current.isLeftClosed) {
          appSplitterRef.current?.animateWidth('320px', 'left');
        }
      }

      if (defaultSelectedFile) onSetSelectedFile(defaultSelectedFile);
    }, [defaultSelectedFile, defaultShowLayout]);

    useUpdateLayoutEffect(() => {
      if (isPureFile === true) setIsPureFile(defaultShowLayout === 'file');
    }, [defaultShowLayout]);

    return (
      <ChatSplitterContextProvider useChatSplitterProps={useChatSplitterProps}>
        <AppSplitter
          ref={appSplitterRef}
          leftChildren={
            <ChatContainer
              selectedFile={selectedFile}
              chatContent={chatContent}
              isPureFile={isPureFile}
            />
          }
          rightChildren={<FileContainer selectedFile={selectedFile} />}
          autoSaveId="chat-splitter"
          defaultLayout={defaultSplitterLayout}
          preserveSide="left"
          rightHidden={!hasFile}
          leftPanelMaxSize={hasFile ? 625 : undefined}
          leftPanelMinSize={hasFile ? 250 : undefined}
          rightPanelMinSize={450}
        />
      </ChatSplitterContextProvider>
    );
  }
);

ChatLayout.displayName = 'ChatSplitter';
