import {
  ContextSelector,
  createContext,
  useContextSelector
} from '@fluentui/react-context-selector';
import React, { PropsWithChildren, useTransition } from 'react';
import type { SelectedFile } from '../interfaces';
import type { ChatSplitterProps } from '../ChatLayout';
import { useMemoizedFn } from 'ahooks';
import type { AppSplitterRef } from '@/components/layout';
import { createChatAssetRoute, createFileRoute } from './helpers';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { DEFAULT_CHAT_OPTION } from './config';
import { useAutoSetLayout } from '../hooks';
import { useChatFileLayout } from './useChatFileLayout';

interface UseChatSplitterProps {
  defaultSelectedLayout: ChatSplitterProps['defaultSelectedLayout'];
  defaultSelectedFile: ChatSplitterProps['defaultSelectedFile'];
  appSplitterRef: React.RefObject<AppSplitterRef>;
  chatId: string | undefined;
}

export const useChatLayout = ({
  defaultSelectedLayout,
  defaultSelectedFile,
  appSplitterRef,
  chatId
}: UseChatSplitterProps) => {
  const [isPending, startTransition] = useTransition();
  const onChangePage = useAppLayoutContextSelector((state) => state.onChangePage);

  const animateOpenSplitter = useMemoizedFn((side: 'left' | 'right' | 'both') => {
    if (appSplitterRef.current) {
      const { animateWidth, isSideClosed } = appSplitterRef.current;
      if (side === 'left') {
        animateWidth('100%', 'left');
      } else if (side === 'right') {
        animateWidth('100%', 'right');
      } else if (side === 'both' && (isSideClosed('right') || isSideClosed('left'))) {
        animateWidth(DEFAULT_CHAT_OPTION, 'left');
        setIsPureChat(false);
        setIsPureFile(false);
        fileLayoutContext?.closeSecondaryView();
      }
    }
  });

  const onSetSelectedFile = useMemoizedFn((file: SelectedFile) => {
    const isChatView = defaultSelectedLayout === 'chat' || defaultSelectedLayout === 'both';
    const fileType = file.type;
    const fileId = file.id;
    const route =
      isChatView && chatId !== undefined
        ? createChatAssetRoute({ chatId, assetId: fileId, type: fileType })
        : createFileRoute({ assetId: fileId, type: fileType });

    if (route) {
      onChangePage(route);
      startTransition(() => {
        animateOpenSplitter('both');
      });
    }
  });

  const onCollapseFileClick = useMemoizedFn((close?: boolean) => {
    const isCloseAction = close ?? isCollapseOpen;
    const isFileLayout = defaultSelectedLayout === 'file';

    setIsCollapseOpen(!isCloseAction);

    if (isFileLayout) {
      // For file layout, toggle between 'both' and 'right'
      animateOpenSplitter(!isCloseAction && defaultSelectedFile ? 'both' : 'right');
    } else {
      // For other layouts, toggle between 'right' and 'both'
      animateOpenSplitter(!isCloseAction ? 'right' : 'both');
    }
  });

  const {
    setIsPureChat,
    setIsCollapseOpen,
    isPureFile,
    isPureChat,
    setIsPureFile,
    collapseDirection,
    isCollapseOpen
  } = useAutoSetLayout({
    defaultSelectedLayout
  });

  const fileLayoutContext = useChatFileLayout({
    selectedFileId: defaultSelectedFile?.id,
    selectedFileType: defaultSelectedFile?.type
  });

  return {
    ...fileLayoutContext,
    collapseDirection,
    isCollapseOpen,
    isPureFile,
    isPureChat,
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
