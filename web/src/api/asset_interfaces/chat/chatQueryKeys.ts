import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BusterChat, BusterChatListItem } from './chatInterfaces';
import type { GetChatListParams } from '@/api/request_interfaces/chats';

const chatsGetChat = (chatId: string) =>
  queryOptions<BusterChat>({
    queryKey: ['chats', 'get', chatId] as const,
    staleTime: 10 * 1000
  });

const chatsGetList = (filters?: GetChatListParams) =>
  queryOptions<BusterChatListItem[]>({
    queryKey: ['chats', 'list', filters] as const
  });

const deleteChat = () => {
  const queryKey = ['chats', 'list'] as const;
  return queryOptions<BusterChatListItem[]>({
    queryKey
  });
};

export const chatQueryKeys = {
  '/chats/get:getChat': chatsGetChat,
  '/chats/list:getChatsList': chatsGetList,
  '/chats/delete:deleteChat': deleteChat
};

const ExampleComponent = () => {
  const queryClient = useQueryClient();
  const options = chatQueryKeys['/chats/get:getChat']!('123');
  const queryKey = options.queryKey;

  const data = queryClient.getQueryData(queryKey);

  const { data: data2 } = useQuery(options);

  queryClient.setQueryData(queryKey, (d) => {
    return d;
  });

  const options2 = chatQueryKeys['/chats/delete:deleteChat']!();
  const queryKey2 = options2.queryKey;

  const data3 = queryClient.getQueryData(queryKey2);

  //
};
