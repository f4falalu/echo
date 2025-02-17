'use client';

import React, { useState } from 'react';
import { AppContent } from '../../../../components/layout/AppContent';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useMemoizedFn, useMount } from 'ahooks';
import { VerificationStatus } from '@/api/asset_interfaces';
import { useBusterMetricListByFilter } from '@/context/Metrics';
import { ChatListHeader } from './ChatListHeader';
import { ChatItemsContainer } from './ChatItemsContainer';

export const ChatListContainer: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  const onToggleChatsModal = useAppLayoutContextSelector((s) => s.onToggleChatsModal);
  const [filters, setFilters] = useState<VerificationStatus[]>([]);
  const type = 'logs';

  const adminView = type === 'logs';
  // const { list, fetched } = useBusterMetricListByFilter({
  //   filters,
  //   admin_view: adminView
  // });

  const onSetFilters = useMemoizedFn((newFilters: VerificationStatus[]) => {
    setFilters(newFilters);
  });

  useMount(async () => {
    onSetFilters([]);
  });

  return (
    <div className={`${className} flex h-full flex-col`}>
      <ChatListHeader />
      <AppContent>
        <ChatItemsContainer
          type={type}
          metrics={[]}
          loading={false}
          openNewMetricModal={onToggleChatsModal}
          className="flex-col overflow-hidden"
        />
      </AppContent>
    </div>
  );
};
