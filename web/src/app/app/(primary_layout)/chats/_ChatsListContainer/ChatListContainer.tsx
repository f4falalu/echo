'use client';

import React, { useState } from 'react';
import { ChatItemsContainer } from './ChatItemsContainer';
import { useGetListChats } from '@/api/buster_rest/chats';
import { GetChatListParams } from '@/api/request_interfaces/chats';

export const ChatListContainer: React.FC<{}> = ({}) => {
  const [filters, setFilters] = useState<Partial<GetChatListParams>>({
    admin_view: false
  });

  const { data: list, isFetched } = useGetListChats(filters);

  return <ChatItemsContainer chats={list} loading={!isFetched} />;
};
