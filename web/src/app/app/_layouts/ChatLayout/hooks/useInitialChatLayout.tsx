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
  const [isPureFile, setIsPureFile] = useState(defaultSelectedLayout === 'file');
  const [isPureChat, setIsPureChat] = useState(defaultSelectedLayout === 'chat');
  const [isCollapseOpen, setIsCollapseOpen] = useState(
    isPureChat || isReasoningFile ? true : false
  );

  const collapseDirection: 'left' | 'right' = useMemo(() => {
    if (defaultSelectedFile?.type === 'reasoning') return 'right';

    return defaultSelectedLayout === 'file' ? 'left' : 'right';
  }, [defaultSelectedLayout, defaultSelectedFile?.type]);

  const resetChatForNewChat = useMemoizedFn(() => {
    onCollapseFileClick(true);
    setIsPureChat(true);
  });

  useUpdateLayoutEffect(() => {
    if (isPureFile === true) setIsPureFile(defaultSelectedLayout === 'file');
    if (isPureChat === true) setIsPureChat(defaultSelectedLayout === 'chat');
  }, [defaultSelectedLayout]);

  useUpdateEffect(() => {
    if (chatId && getChatMemoized(chatId)?.isNewChat) {
      resetChatForNewChat();
    }
  }, [chatId]);

  // useEffect(() => {
  //   if (isReasoningFile) {
  //     setIsCollapseOpen(false);
  //   }
  // }, [isReasoningFile]);

  return {
    isPureFile,
    isPureChat,
    setIsPureChat,
    setIsPureFile,
    collapseDirection,
    setIsCollapseOpen,
    isCollapseOpen
  };
};
