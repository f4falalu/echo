'use client';

import React, { useState } from 'react';
import { VerificationStatus } from '@/api/asset_interfaces';
import { MetricListHeader } from './MetricListHeader';
import { MetricItemsContainer } from './MetricItemsContainer';
import { AppPageLayout } from '@/components/ui/layouts';
import { useGetMetricsList } from '@/api/buster_rest/metrics';

export const MetricListContainer: React.FC<{}> = ({}) => {
  const [filters, setFilters] = useState<VerificationStatus[]>([]);
  const { data: metricList, isFetching, isFetched } = useGetMetricsList({ status: filters });

  return (
    <AppPageLayout header={<MetricListHeader filters={filters} onSetFilters={setFilters} />}>
      <MetricItemsContainer
        metrics={metricList || []}
        loading={!isFetched}
        className="flex-col overflow-hidden"
      />
    </AppPageLayout>
  );
};
