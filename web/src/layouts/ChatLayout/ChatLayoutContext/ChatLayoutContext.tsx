'use client';

import {
  ContextSelector,
  createContext,
  useContextSelector
} from '@fluentui/react-context-selector';
import React, { PropsWithChildren, useTransition } from 'react';
import type { SelectedFile } from '../interfaces';
import type { ChatSplitterProps } from '../ChatLayout';
import { useMemoizedFn } from 'ahooks';
import type { AppSplitterRef } from '@/components/ui/layouts';
import { createChatAssetRoute, createFileRoute } from './helpers';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { DEFAULT_CHAT_OPTION_SIDEBAR_SIZE } from './config';
import { SelectedFileParams, useInitialChatLayout } from '../hooks';
import { useChatFileLayout } from './useChatFileLayout';

interface UseChatSplitterProps {
  selectedLayout: SelectedFileParams['selectedLayout'];
  selectedFile: SelectedFileParams['selectedFile'];
  appSplitterRef: React.RefObject<AppSplitterRef>;
  chatId: string | undefined;
}

export const useChatLayout = ({
  selectedLayout,
  selectedFile,
  appSplitterRef,
  chatId
}: UseChatSplitterProps) => {
  const [isPending, startTransition] = useTransition();
  const onChangePage = useAppLayoutContextSelector((state) => state.onChangePage);

  const animateOpenSplitter = useMemoizedFn((side: 'left' | 'right' | 'both') => {
    if (appSplitterRef.current) {
      const { animateWidth } = appSplitterRef.current;
      if (side === 'left') {
        animateWidth('100%', 'left');
      } else if (side === 'right') {
        animateWidth('100%', 'right');
      } else if (side === 'both') {
        //&& (isSideClosed('right') || isSideClosed('left'))
        animateWidth(DEFAULT_CHAT_OPTION_SIDEBAR_SIZE, 'left');
        setRenderViewLayoutKey('both');
        fileLayoutContext?.closeSecondaryView();
      }
    }
  });

  const onSetSelectedFile = useMemoizedFn((file: SelectedFile) => {
    const isChatView = selectedLayout === 'chat' || selectedLayout === 'both';
    const fileType = file.type;
    const fileId = file.id;
    const route =
      isChatView && chatId !== undefined
        ? createChatAssetRoute({ chatId, assetId: fileId, type: fileType })
        : createFileRoute({ assetId: fileId, type: fileType });

    if (route) {
      setRenderViewLayoutKey('both');
      onChangePage(route);
      startTransition(() => {
        animateOpenSplitter('both');
      });
    }
  });

  const onCollapseFileClick = useMemoizedFn((close?: boolean) => {
    const isCloseAction = close ?? isCollapseOpen;
    const isFileLayout = selectedLayout === 'file';

    setIsCollapseOpen(!isCloseAction);

    if (selectedFile && selectedFile.type === 'reasoning') {
      animateOpenSplitter(!isCloseAction ? 'both' : 'left');
    } else if (isFileLayout) {
      // For file layout, toggle between 'both' and 'right'
      animateOpenSplitter(!isCloseAction && selectedFile ? 'both' : 'right');
    } else {
      // For other layouts, toggle between 'right' and 'both'
      animateOpenSplitter(isCloseAction ? 'left' : 'both');
    }
  });

  const {
    setIsCollapseOpen,
    setRenderViewLayoutKey,
    renderViewLayoutKey,
    collapseDirection,
    isCollapseOpen
  } = useInitialChatLayout({
    selectedLayout,
    selectedFile,
    chatId,
    onCollapseFileClick
  });

  const fileLayoutContext = useChatFileLayout({
    selectedFileId: selectedFile?.id,
    selectedFileType: selectedFile?.type
  });

  return {
    ...fileLayoutContext,
    renderViewLayoutKey,
    collapseDirection,
    isCollapseOpen,
    onSetSelectedFile,
    onCollapseFileClick,
    animateOpenSplitter
  };
};

const ChatLayoutContext = createContext<ReturnType<typeof useChatLayout>>(
  {} as ReturnType<typeof useChatLayout>
);

interface ChatLayoutContextProviderProps {}

export const ChatLayoutContextProvider: React.FC<
  PropsWithChildren<
    ChatLayoutContextProviderProps & {
      useChatLayoutProps: ReturnType<typeof useChatLayout>;
    }
  >
> = React.memo(({ children, useChatLayoutProps }) => {
  return (
    <ChatLayoutContext.Provider value={useChatLayoutProps}>{children}</ChatLayoutContext.Provider>
  );
});

ChatLayoutContextProvider.displayName = 'ChatLayoutContextProvider';

export const useChatLayoutContextSelector = <T,>(
  selector: ContextSelector<ReturnType<typeof useChatLayout>, T>
) => useContextSelector(ChatLayoutContext, selector);
