import type { IBusterChat } from '@/context/Chats/interfaces';
import type { SelectedFile } from '../interfaces';
import { useChatIndividual } from '@/context/Chats';
import { useFileFallback } from './useFileFallback';

export const useSubscribeIndividualChat = ({
  chatId,
  defaultSelectedFile
}: {
  chatId?: string;
  defaultSelectedFile?: SelectedFile;
}): IBusterChat | undefined => {
  const { chat } = useChatIndividual(chatId || '');

  const { memoizedFallbackToChat } = useFileFallback({ defaultSelectedFile });

  const selectedChat: IBusterChat | undefined = chatId ? chat : memoizedFallbackToChat;

  return selectedChat;
};
