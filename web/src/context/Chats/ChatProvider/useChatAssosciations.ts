import { useMemoizedFn } from '@/hooks';
import { useDeleteChat } from '@/api/buster_rest/chats';

export const useChatAssosciations = () => {
  const { mutate: deleteChat } = useDeleteChat();

  const onDeleteChat = useMemoizedFn(async (chatId: string | string[]) => {
    const arrayChatIds = Array.isArray(chatId) ? chatId : [chatId];
    deleteChat(arrayChatIds);
  });

  return {
    onDeleteChat
  };
};
