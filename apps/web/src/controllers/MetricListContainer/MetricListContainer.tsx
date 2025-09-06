import type { VerificationStatus } from '@buster/server-shared/share';
import type React from 'react';
import { useMemo, useState } from 'react';
import { useGetMetricsList } from '@/api/buster_rest/metrics';
import { AppPageLayout } from '@/components/ui/layouts/AppPageLayout';
import { MetricItemsContainer } from './MetricItemsContainer';
import { MetricListHeader } from './MetricListHeader';

export const MetricListContainer: React.FC = () => {
  const [filters, setFilters] = useState<VerificationStatus[]>([]);
  const { data: metricList, isFetched } = useGetMetricsList({ status: filters });

  return (
    <AppPageLayout
      headerSizeVariant="list"
      header={useMemo(
        () => <MetricListHeader filters={filters} onSetFilters={setFilters} />,
        [filters]
      )}
    >
      <MetricItemsContainer
        metrics={metricList}
        loading={!isFetched}
        className="flex-col overflow-hidden"
      />
    </AppPageLayout>
  );
};

MetricListContainer.displayName = 'MetricListContainer';
