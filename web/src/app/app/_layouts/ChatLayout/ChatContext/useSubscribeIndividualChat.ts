import type { IBusterChat } from '@/context/Chats/interfaces';
import type { SelectedFile } from '../interfaces';
import { useBusterChatContextSelector } from '@/context/Chats';
import { useEffect } from 'react';
import { useUnmount } from 'ahooks';
import { useFileFallback } from './useFileFallback';

export const useSubscribeIndividualChat = ({
  chatId,
  defaultSelectedFile
}: {
  chatId?: string;
  defaultSelectedFile?: SelectedFile;
}): IBusterChat | undefined => {
  const chat: IBusterChat | undefined = useBusterChatContextSelector((x) => x.chats[chatId || '']);
  const subscribeToChat = useBusterChatContextSelector((x) => x.subscribeToChat);
  const unsubscribeFromChat = useBusterChatContextSelector((x) => x.unsubscribeFromChat);

  const { memoizedFallbackToChat } = useFileFallback({
    defaultSelectedFile
  });

  const selectedChat: IBusterChat | undefined = chatId ? chat : memoizedFallbackToChat;

  useEffect(() => {
    if (chatId) subscribeToChat({ chatId });
  }, [chatId]);

  useUnmount(() => {
    if (chatId) unsubscribeFromChat({ chatId });
  });

  return selectedChat;
};
