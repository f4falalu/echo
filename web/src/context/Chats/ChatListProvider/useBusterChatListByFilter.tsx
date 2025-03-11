import { useGetListChats } from '@/api/buster_rest/chats';
import { GetChatListParams } from '@/api/request_interfaces/chats';
import { useMemo } from 'react';

export const useBusterChatListByFilter = (
  filtersProp: Omit<GetChatListParams, 'page_token' | 'page_size'>
) => {
  const filters = useMemo(
    () => ({ ...filtersProp, page_token: 0, page_size: 3000 }),
    [filtersProp]
  );

  const { data: chatsList, isFetched: isFetchedChatsList } = useGetListChats(filters);

  return {
    list: chatsList,
    isFetched: isFetchedChatsList
  };
};
