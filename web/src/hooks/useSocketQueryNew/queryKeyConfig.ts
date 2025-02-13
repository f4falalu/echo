import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BusterChat, BusterChatListItem } from '@/api/asset_interfaces/chat';
import { queryOptions } from '@tanstack/react-query';
import { ChatListEmitPayload } from '@/api/buster_socket/chats';

const chatsGetChat = (chatId: string) =>
  queryOptions({
    queryKey: ['chats', 'get', chatId] as const,
    queryFn: () => {
      return Promise.resolve({ id: chatId } as BusterChat);
    },
    staleTime: 10 * 1000
  });

const chatsGetList = (filters?: ChatListEmitPayload) =>
  queryOptions({
    queryKey: ['chats', 'list', filters] as const,
    queryFn: () => {
      return Promise.resolve([] as BusterChatListItem[]);
    }
  });

const deleteChat = (chatId: string) => {
  const queryKey = chatsGetChat(chatId)?.queryKey;
  return queryOptions({
    queryKey,
    queryFn: async () => {
      return Promise.resolve({ id: chatId });
    }
  });
};

export const queryOptionsConfig = {
  '/chats/get:getChat': chatsGetChat,
  '/chats/list:getChatsList': chatsGetList,
  '/chats/delete:deleteChat': deleteChat
};

const ExampleComponent = () => {
  const queryClient = useQueryClient();
  const options = queryOptionsConfig['/chats/get:getChat']!('123');
  const queryKey = options.queryKey;

  const data = queryClient.getQueryData(queryKey);

  const { data: data2 } = useQuery(options);

  queryClient.setQueryData(queryKey, (d) => {
    return d;
  });

  const options2 = queryOptionsConfig['/chats/delete:deleteChat']!('123');
  const queryKey2 = options2.queryKey;

  const data3 = queryClient.getQueryData(queryKey2);

  //
};
