import { queryOptions } from '@tanstack/react-query';
import type { BusterChat, BusterChatListItem } from '@/api/asset_interfaces';
import type { GetChatListParams } from '@/api/request_interfaces/chats';

const chatsGetChat = (chatId: string) =>
  queryOptions<BusterChat>({
    queryKey: ['chats', 'get', chatId] as const,
    staleTime: 10 * 1000
  });

const chatsGetList = (filters?: GetChatListParams) =>
  queryOptions<BusterChatListItem[]>({
    queryKey: ['chats', 'list', filters] as const,
    staleTime: 10 * 1000
  });

export const chatQueryKeys = {
  '/chats/get:getChat': chatsGetChat,
  '/chats/list:getChatsList': chatsGetList
};

// const ExampleComponent = () => {
//   const queryClient = useQueryClient();
//   const options = chatQueryKeys['/chats/get:getChat']!('123');
//   const queryKey = options.queryKey;

//   const data = queryClient.getQueryData(queryKey);

//   const { data: data2 } = useQuery(options);

//   queryClient.setQueryData(queryKey, (d) => {
//     return d;
//   });

//   const options2 = chatQueryKeys['/chats/list:getChatsList']!();
//   const queryKey2 = options2.queryKey;

//   const data3 = queryClient.getQueryData(queryKey2);

//   //
// };
