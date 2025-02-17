import { updateChatToIChat } from '@/utils/chat';
import { useSocketQueryEmitOn } from '@/api/buster_socket_query';
import { queryKeys } from '@/api/query_keys';
import { useQueryClient } from '@tanstack/react-query';

export const useChatIndividual = (chatId: string) => {
  const queryClient = useQueryClient();

  const { data: chat, isFetched: isFetchedChat } = useSocketQueryEmitOn(
    {
      route: '/chats/get',
      payload: { id: chatId }
    },
    '/chats/get:getChat',
    queryKeys['chatsGetChat'](chatId),
    (_currentData, newData) => {
      const { iChat, iChatMessages } = updateChatToIChat(newData, false);
      for (const message of iChatMessages) {
        const options = queryKeys['chatsMessages'](message.id);
        const queryKey = options.queryKey;
        queryClient.setQueryData(queryKey, message);
      }
      return iChat;
    }
  );

  return {
    chat,
    isFetchedChat
  };
};
