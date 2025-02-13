import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BusterChat, BusterChatListItem } from '@/api/asset_interfaces/chat';
import { queryOptions } from '@tanstack/react-query';
import { ChatListEmitPayload } from '@/api/buster_socket/chats';

const chatsGetChat = (chatId: string) =>
  queryOptions<BusterChat>({
    queryKey: ['chats', 'get', chatId] as const,
    staleTime: 10 * 1000
  });

const chatsGetList = (filters?: ChatListEmitPayload) =>
  queryOptions<BusterChatListItem[]>({
    queryKey: ['chats', 'list', filters] as const
  });

const deleteChat = (chatId: string) => {
  const queryKey = chatsGetChat(chatId)?.queryKey;
  return queryOptions<BusterChat>({
    queryKey
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
