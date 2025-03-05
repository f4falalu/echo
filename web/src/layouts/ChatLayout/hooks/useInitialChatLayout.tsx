import { useMemoizedFn, useUpdateEffect, useUpdateLayoutEffect } from 'ahooks';
import { useEffect, useMemo, useState } from 'react';
import { ChatSplitterProps } from '../ChatLayout';
import { useBusterChatContextSelector } from '@/context/Chats';
import { SelectedFileParams } from './useDefaultFile';

export const useInitialChatLayout = ({
  selectedLayout,
  selectedFile,
  chatId,
  onCollapseFileClick
}: {
  selectedLayout: SelectedFileParams['selectedLayout'];
  chatId: string | undefined;
  selectedFile: SelectedFileParams['selectedFile'];
  onCollapseFileClick: (close?: boolean) => void;
}) => {
  const getChatMemoized = useBusterChatContextSelector((x) => x.getChatMemoized);
  const isReasoningFile = selectedFile?.type === 'reasoning';
  const [renderViewLayoutKey, setRenderViewLayoutKey] = useState<'chat' | 'file' | 'both'>(
    selectedLayout || 'chat'
  );
  const [isCollapseOpen, setIsCollapseOpen] = useState(isReasoningFile ? true : false);

  const collapseDirection: 'left' | 'right' = useMemo(() => {
    if (selectedFile?.type === 'reasoning') return 'right';

    return selectedLayout === 'file' ? 'left' : 'right';
  }, [selectedLayout, selectedFile?.type]);

  const resetChatForNewChat = useMemoizedFn(() => {
    onCollapseFileClick(true);
  });

  useUpdateLayoutEffect(() => {
    if (selectedLayout === 'both') setRenderViewLayoutKey('both');
  }, [selectedLayout]);

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
