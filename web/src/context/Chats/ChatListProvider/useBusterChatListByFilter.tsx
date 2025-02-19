import { useSocketQueryEmitOn } from '@/api/buster_socket_query';
import { queryKeys } from '@/api/query_keys';
import { GetChatListParams } from '@/api/request_interfaces/chats';
import { useMemo } from 'react';

export const useBusterChatListByFilter = (
  filtersProp: Omit<GetChatListParams, 'page_token' | 'page_size'>
) => {
  const filters = useMemo(
    () => ({ ...filtersProp, page_token: 0, page_size: 3000 }),
    [filtersProp]
  );

  const { data: chatsList, isFetched: isFetchedChatsList } = useSocketQueryEmitOn({
    emitEvent: {
      route: '/chats/list',
      payload: filters
    },
    responseEvent: '/chats/list:getThreadsList',
    options: queryKeys['chatsGetList'](filters)
  });

  //ACTIONS

  return {
    list: chatsList || [],
    isFetched: isFetchedChatsList
  };
};
