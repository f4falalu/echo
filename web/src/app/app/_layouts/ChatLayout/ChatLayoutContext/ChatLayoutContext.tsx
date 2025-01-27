import {
  ContextSelector,
  createContext,
  useContextSelector
} from '@fluentui/react-context-selector';
import React, { PropsWithChildren, useMemo, useState, useTransition } from 'react';
import type { SelectedFile } from '../interfaces';
import type { ChatSplitterProps } from '../ChatLayout';
import { useMemoizedFn } from 'ahooks';
import type { AppSplitterRef } from '@/components/layout';
import { createChatAssetRoute, createFileRoute } from './helpers';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { DEFAULT_CHAT_OPTION } from './config';
import { useAutoSetLayout } from '../hooks';

interface UseChatSplitterProps {
  defaultSelectedFile: SelectedFile | undefined;
  defaultSelectedLayout: ChatSplitterProps['defaultSelectedLayout'];
  appSplitterRef: React.RefObject<AppSplitterRef>;
  chatId: string | undefined;
}

export const useChatLayout = ({
  defaultSelectedFile,
  defaultSelectedLayout,
  appSplitterRef,
  chatId
}: UseChatSplitterProps) => {
  const [isPending, startTransition] = useTransition();
  const onChangePage = useAppLayoutContextSelector((state) => state.onChangePage);
  const selectedLayout = defaultSelectedLayout;
  const selectedFileId = defaultSelectedFile?.id;
  const selectedFileType = defaultSelectedFile?.type;
  const hasFile = !!selectedFileId;

  const selectedFileTitle: string = useMemo(() => {
    if (!selectedFileId) return '';
    return 'test';
  }, [selectedFileId]);

  const animateOpenSplitter = useMemoizedFn((side: 'left' | 'right' | 'both') => {
    if (appSplitterRef.current) {
      const { animateWidth, isSideClosed } = appSplitterRef.current;
      if (side === 'left') {
        animateWidth('100%', 'left');
      } else if (side === 'right') {
        animateWidth('100%', 'right');
      } else if (side === 'both' && (isSideClosed('right') || isSideClosed('left'))) {
        animateWidth(DEFAULT_CHAT_OPTION, 'left');
      }
    }
  });

  const onSetSelectedFile = useMemoizedFn((file: SelectedFile) => {
    const isChatView = defaultSelectedLayout === 'chat' || defaultSelectedLayout === 'both';
    const fileType = file.type;
    const fileId = file.id;
    const route =
      isChatView && chatId
        ? createChatAssetRoute({ chatId, assetId: fileId, type: fileType })
        : createFileRoute({ assetId: fileId, type: fileType });

    if (route) {
      onChangePage(route);
      setIsPureChat(false);
      startTransition(() => {
        animateOpenSplitter('both');
      });
    }
  });

  const onCollapseFileClick = useMemoizedFn((close?: boolean) => {
    const isCloseAction = close ?? selectedLayout === 'both';
    if (isCloseAction) {
      animateOpenSplitter('left');
    } else {
      animateOpenSplitter('both');
    }
  });

  const { setIsPureChat, isPureFile, isPureChat } = useAutoSetLayout({
    defaultSelectedLayout,
    selectedLayout
  });

  return {
    selectedFileTitle,
    selectedFileType,
    selectedLayout,
    selectedFileId,
    hasFile,
    isPureFile,
    isPureChat,
    onSetSelectedFile,
    onCollapseFileClick,
    animateOpenSplitter
  };
};

const ChatSplitterContext = createContext<ReturnType<typeof useChatLayout>>(
  {} as ReturnType<typeof useChatLayout>
);

interface ChatSplitterContextProviderProps {}

export const ChatSplitterContextProvider: React.FC<
  PropsWithChildren<
    ChatSplitterContextProviderProps & {
      useChatSplitterProps: ReturnType<typeof useChatLayout>;
    }
  >
> = React.memo(({ children, useChatSplitterProps }) => {
  return (
    <ChatSplitterContext.Provider value={useChatSplitterProps}>
      {children}
    </ChatSplitterContext.Provider>
  );
});

ChatSplitterContextProvider.displayName = 'ChatSplitterContextProvider';

export const useChatSplitterContextSelector = <T,>(
  selector: ContextSelector<ReturnType<typeof useChatLayout>, T>
) => useContextSelector(ChatSplitterContext, selector);
