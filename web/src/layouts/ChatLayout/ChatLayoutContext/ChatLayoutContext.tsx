'use client';

import { createContext, useContextSelector } from 'use-context-selector';
import React, { PropsWithChildren } from 'react';
import { useMemoizedFn } from '@/hooks';
import type { AppSplitterRef } from '@/components/ui/layouts';
import { DEFAULT_CHAT_OPTION_SIDEBAR_SIZE } from './config';
import { useLayoutCollapse, useSelectedFileAndLayout } from '../hooks';
import { useChatFileLayout } from './useChatFileLayout';

interface UseChatSplitterProps {
  appSplitterRef: React.RefObject<AppSplitterRef | null>;
}

export const useChatLayout = ({ appSplitterRef }: UseChatSplitterProps) => {
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
        fileLayoutContext?.closeSecondaryView();
      }
    }
  });

  const {
    selectedFile,
    selectedLayout,
    chatId,
    onSetSelectedFile,
    setRenderViewLayoutKey,
    renderViewLayoutKey
  } = useSelectedFileAndLayout({ animateOpenSplitter });

  const { onCollapseFileClick } = useLayoutCollapse({
    animateOpenSplitter
  });

  const fileLayoutContext = useChatFileLayout({
    selectedFileId: selectedFile?.id,
    selectedFileType: selectedFile?.type
  });

  return {
    ...fileLayoutContext,
    chatId,
    selectedLayout,
    renderViewLayoutKey,
    selectedFileType: selectedFile?.type,
    selectedFile,
    onCollapseFileClick,
    onSetSelectedFile,
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
  selector: (state: ReturnType<typeof useChatLayout>) => T
) => useContextSelector(ChatLayoutContext, selector);
