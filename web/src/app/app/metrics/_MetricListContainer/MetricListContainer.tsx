'use client';

import React, { useState } from 'react';
import { AppContent } from '../../../../components/layout/AppContent';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useMemoizedFn, useMount } from 'ahooks';
import { VerificationStatus } from '@/api/asset_interfaces';
import { useBusterMetricListByFilter } from '@/context/Metrics';
import { MetricListHeader } from './MetricListHeader';
import { MetricItemsContainer } from './MetricItemsContainer';

export const MetricListContainer: React.FC<{
  className?: string;
  type: 'logs' | 'metrics';
}> = ({ type, className = '' }) => {
  const onToggleChatsModal = useAppLayoutContextSelector((s) => s.onToggleChatsModal);
  const [filters, setFilters] = useState<VerificationStatus[]>([]);
  const adminView = type === 'logs';
  const { metricList, isFetched } = useBusterMetricListByFilter({
    filters,
    admin_view: adminView
  });

  const onSetFilters = useMemoizedFn((newFilters: VerificationStatus[]) => {
    setFilters(newFilters);
  });

  useMount(async () => {
    onSetFilters([]);
  });

  return (
    <div className={`${className} flex h-full flex-col`}>
      <MetricListHeader type={type} filters={filters} onSetFilters={onSetFilters} />
      <AppContent>
        <MetricItemsContainer
          type={type}
          metrics={metricList || []}
          loading={!isFetched}
          openNewMetricModal={onToggleChatsModal}
          className="flex-col overflow-hidden"
        />
      </AppContent>
    </div>
  );
};
