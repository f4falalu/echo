'use client';

import React, { useState } from 'react';
import { AppContent } from '../../../../components/ui/layouts/AppContent';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useMemoizedFn, useMount } from 'ahooks';
import { useBusterChatListByFilter } from '@/context/Chats';
import { ChatListHeader } from './ChatListHeader';
import { ChatItemsContainer } from './ChatItemsContainer';

export const ChatListContainer: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  const onToggleChatsModal = useAppLayoutContextSelector((s) => s.onToggleChatsModal);
  const [filters, setFilters] = useState<Parameters<typeof useBusterChatListByFilter>[0]>({
    admin_view: false
  });

  const { list, isFetched } = useBusterChatListByFilter(filters);

  const onSetFilters = useMemoizedFn(
    (newFilters: Parameters<typeof useBusterChatListByFilter>[0]) => {
      setFilters(newFilters);
    }
  );

  useMount(async () => {
    onSetFilters({ admin_view: false });
  });

  return (
    <div className={`${className} flex h-full flex-col`}>
      <ChatListHeader />
      <AppContent>
        <ChatItemsContainer
          chats={list}
          loading={!isFetched}
          openNewMetricModal={onToggleChatsModal}
          className="flex-col overflow-hidden"
        />
      </AppContent>
    </div>
  );
};
