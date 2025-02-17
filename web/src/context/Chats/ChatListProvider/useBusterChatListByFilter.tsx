import { useSocketQueryEmitOn } from '@/api/buster_socket_query';
import { queryKeys } from '@/api/query_keys';
import { GetChatListParams } from '@/api/request_interfaces/chats';

export const useBusterChatListByFilter = (filters: GetChatListParams) => {
  const { data: chatsList, isFetched: isFetchedChatsList } = useSocketQueryEmitOn(
    { route: '/chats/list', payload: { page_token: 0, page_size: 3000, admin_view: false } },
    '/chats/list:getChatsList',
    queryKeys['chatsGetList'](filters)
  );

  //ACTIONS

  return {
    list: chatsList,
    isFetched: isFetchedChatsList
  };
};
