import { useMemoizedFn } from 'ahooks';
import { useSocketQueryMutation } from '@/api/buster_socket_query';
import { queryKeys } from '@/api/query_keys';

const getChatsListOptions = queryKeys.chatsGetList();

export const useChatAssosciations = () => {
  const { mutate: deleteChat } = useSocketQueryMutation({
    emitEvent: '/chats/delete',
    responseEvent: '/chats/delete:deleteChat',
    options: getChatsListOptions,
    preCallback: (currentData, deleteDataIds) => {
      //TODO: maybe use query client to remove all the chats from the query cache?
      const allDeleteDataIds = deleteDataIds.map((d) => d.id);
      return currentData?.filter((chat) => !allDeleteDataIds.includes(chat.id)) || [];
    }
  });

  const onDeleteChat = useMemoizedFn(async (chatId: string) => {
    deleteChat([{ id: chatId }]);
  });

  const onDeleteChats = useMemoizedFn(async (chatIds: string[]) => {
    deleteChat(chatIds.map((id) => ({ id })));
  });

  return {
    onDeleteChat,
    onDeleteChats
  };
};
