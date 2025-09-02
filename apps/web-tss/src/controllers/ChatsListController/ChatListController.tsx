import type React from 'react';
import { useState } from 'react';
import {
  type getListChats,
  type getListLogs,
  useGetListChats,
  useGetListLogs,
} from '@/api/buster_rest/chats';
import { useIsUserAdmin } from '@/api/buster_rest/users/useGetUserInfo';
import { ChatItemsContainer } from './ChatItemsContainer';

export const ChatListContainer: React.FC<{
  type: 'logs' | 'chats';
}> = ({ type }) => {
  const isAdmin = useIsUserAdmin();

  if (type === 'chats' || !isAdmin) {
    return <ChatsContainer />;
  }

  return <LogsContainer />;
};

const ChatsContainer: React.FC<Record<string, never>> = () => {
  const [filters, setFilters] = useState<Partial<Parameters<typeof getListChats>[0]>>({});

  const { data: list, isFetched } = useGetListChats(filters);

  return <ChatItemsContainer chats={list} loading={!isFetched} type={'chats'} />;
};

const LogsContainer: React.FC<Record<string, never>> = () => {
  const [filters, setFilters] = useState<Partial<Parameters<typeof getListLogs>[0]>>({});

  const { data: list, isFetched } = useGetListLogs(filters);

  return <ChatItemsContainer chats={list} loading={!isFetched} type={'logs'} />;
};
