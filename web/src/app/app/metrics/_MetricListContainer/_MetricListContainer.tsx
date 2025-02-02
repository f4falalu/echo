'use client';

import React, { useState } from 'react';
import { AppContent } from '../../../../components/layout/AppContent';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useMemoizedFn, useMount } from 'ahooks';
import { VerificationStatus } from '@/api/asset_interfaces';
import { useBusterMetricListByFilter } from '@/context/Metrics';
import { MetricSidebarHeader } from './_MetricSidebarHeader';
import { MetricItemsContainer } from './_MetricItemsContainer';

export const MetricListContainer: React.FC<{
  className?: string;
  type: 'logs' | 'metrics';
}> = ({ type, className = '' }) => {
  const onToggleChatsModal = useAppLayoutContextSelector((s) => s.onToggleChatsModal);
  const [filters, setFilters] = useState<VerificationStatus[]>([]);
  const adminView = type === 'logs';
  const { list, metricListLoadingStatus } = useBusterMetricListByFilter({
    filters,
    admin_view: adminView
  });

  const onSetFilters = useMemoizedFn((newFilters: VerificationStatus[]) => {
    setFilters(newFilters);
  });

  const onOpenNewMetricModal = useMemoizedFn(() => {
    onToggleChatsModal();
  });

  useMount(async () => {
    onSetFilters([]);
  });

  return (
    <div className={`${className} flex h-full flex-col`}>
      <MetricSidebarHeader type={type} filters={filters} onSetFilters={onSetFilters} />
      <AppContent className="">
        <MetricItemsContainer
          type={type}
          metrics={list}
          openNewMetricModal={onOpenNewMetricModal}
          loading={!metricListLoadingStatus?.fetched}
          className="flex-col overflow-hidden"
        />
      </AppContent>
    </div>
  );
};
