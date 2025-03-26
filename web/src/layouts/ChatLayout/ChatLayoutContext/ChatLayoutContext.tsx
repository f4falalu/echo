'use client';

import { createContext, useContextSelector } from 'use-context-selector';
import React, { PropsWithChildren } from 'react';
import { useMemoizedFn } from '@/hooks';
import type { AppSplitterRef } from '@/components/ui/layouts';
import { DEFAULT_CHAT_OPTION_SIDEBAR_SIZE } from './config';
import { useLayoutCollapse } from './useLayoutCollapse';
import { useSelectedFile } from './useSelectedFile';
import { useLayoutConfig } from './useLayoutConfig';

interface UseLayoutConfigProps {
  appSplitterRef: React.RefObject<AppSplitterRef | null>;
}

export const useChatLayoutContext = ({ appSplitterRef }: UseLayoutConfigProps) => {
  const animateOpenSplitter = useMemoizedFn((side: 'left' | 'right' | 'both') => {
    if (appSplitterRef.current) {
      const { animateWidth, sizes } = appSplitterRef.current;
      const leftSize = sizes[0] ?? 0;
      const rightSize = sizes[1] ?? 0;

      if (side === 'left') {
        animateWidth('100%', 'left');
      } else if (side === 'right') {
        animateWidth('100%', 'right');
      } else if (side === 'both') {
        const shouldAnimate = Number(leftSize) < 200 || parseInt(rightSize as string) < 340;

        if (!shouldAnimate) return;

        animateWidth(DEFAULT_CHAT_OPTION_SIDEBAR_SIZE, 'left');
        setRenderViewLayoutKey('both');
        closeSecondaryView();
      }
    }
  });

  const {
    selectedFile,
    selectedLayout,
    chatId,
    onSetSelectedFile,
    setRenderViewLayoutKey,
    renderViewLayoutKey,
    isVersionHistoryMode
  } = useSelectedFile({ animateOpenSplitter });

  const onCollapseFileClick = useLayoutCollapse({ onSetSelectedFile });

  const {
    selectedFileView,
    selectedFileViewRenderSecondary,
    selectedFileViewSecondary,
    onSetFileView,
    closeSecondaryView
  } = useLayoutConfig({
    selectedFileId: selectedFile?.id,
    selectedFileType: selectedFile?.type,
    isVersionHistoryMode
  });

  return {
    selectedFileViewRenderSecondary,
    selectedFileView,
    selectedFileViewSecondary,
    onSetFileView,
    closeSecondaryView,
    chatId,
    selectedLayout,
    renderViewLayoutKey,
    selectedFileType: selectedFile?.type,
    selectedFile,
    onCollapseFileClick,
    onSetSelectedFile,
    animateOpenSplitter,
    isVersionHistoryMode
  };
};

const ChatLayoutContext = createContext<ReturnType<typeof useChatLayoutContext>>(
  {} as ReturnType<typeof useChatLayoutContext>
);

interface ChatLayoutContextProviderProps {}

export const ChatLayoutContextProvider: React.FC<
  PropsWithChildren<
    ChatLayoutContextProviderProps & {
      useChatLayoutProps: ReturnType<typeof useChatLayoutContext>;
    }
  >
> = React.memo(({ children, useChatLayoutProps }) => {
  return (
    <ChatLayoutContext.Provider value={useChatLayoutProps}>{children}</ChatLayoutContext.Provider>
  );
});

ChatLayoutContextProvider.displayName = 'ChatLayoutContextProvider';

export const useChatLayoutContextSelector = <T,>(
  selector: (state: ReturnType<typeof useChatLayoutContext>) => T
) => useContextSelector(ChatLayoutContext, selector);
