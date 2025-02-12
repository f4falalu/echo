import { useMemoizedFn, useUpdateEffect, useUpdateLayoutEffect } from 'ahooks';
import { useEffect, useMemo, useState } from 'react';
import { ChatSplitterProps } from '../ChatLayout';
import { useBusterChatContextSelector } from '@/context/Chats';

export const useInitialChatLayout = ({
  defaultSelectedLayout,
  defaultSelectedFile,
  chatId,
  onCollapseFileClick
}: {
  defaultSelectedLayout: 'chat' | 'file' | 'both' | undefined;
  chatId: string | undefined;
  defaultSelectedFile: ChatSplitterProps['defaultSelectedFile'];
  onCollapseFileClick: (close?: boolean) => void;
}) => {
  const getChatMemoized = useBusterChatContextSelector((x) => x.getChatMemoized);
  const isReasoningFile = defaultSelectedFile?.type === 'reasoning';
  const [renderViewLayoutKey, setRenderViewLayoutKey] = useState<'chat' | 'file' | 'both'>(
    defaultSelectedLayout || 'chat'
  );
  const [isCollapseOpen, setIsCollapseOpen] = useState(isReasoningFile ? true : false);

  const collapseDirection: 'left' | 'right' = useMemo(() => {
    if (defaultSelectedFile?.type === 'reasoning') return 'right';

    return defaultSelectedLayout === 'file' ? 'left' : 'right';
  }, [defaultSelectedLayout, defaultSelectedFile?.type]);

  const resetChatForNewChat = useMemoizedFn(() => {
    onCollapseFileClick(true);
  });

  useUpdateLayoutEffect(() => {
    if (defaultSelectedLayout === 'both') setRenderViewLayoutKey('both');
  }, [defaultSelectedLayout]);

  useUpdateEffect(() => {
    if (chatId && getChatMemoized(chatId)?.isNewChat) {
      resetChatForNewChat();
    }
  }, [chatId]);

  useEffect(() => {
    if (isReasoningFile && !isCollapseOpen) {
      setIsCollapseOpen(true);
    }
  }, [isReasoningFile]);

  return {
    renderViewLayoutKey,
    setRenderViewLayoutKey,
    collapseDirection,
    setIsCollapseOpen,
    isCollapseOpen
  };
};
