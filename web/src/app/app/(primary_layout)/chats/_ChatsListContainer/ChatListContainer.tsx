'use client';

import React, { useState } from 'react';
import { useBusterChatListByFilter } from '@/context/Chats';
import { ChatItemsContainer } from './ChatItemsContainer';

export const ChatListContainer: React.FC<{}> = ({}) => {
  const [filters, setFilters] = useState<Parameters<typeof useBusterChatListByFilter>[0]>({
    admin_view: false
  });

  const { list, isFetched } = useBusterChatListByFilter(filters);

  return <ChatItemsContainer chats={list} loading={!isFetched} />;
};
