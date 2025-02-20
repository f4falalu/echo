'use client';

import React, { useMemo } from 'react';
import { AppContentHeader } from '../../../../components/ui/layout/AppContentHeader';
import { AppSegmented } from '@/components';
import { VerificationStatus } from '@/api/asset_interfaces';
import { Text } from '@/components';
import { useMemoizedFn } from 'ahooks';
import { SegmentedValue } from 'antd/lib/segmented';

export const MetricListHeader: React.FC<{
  type: 'logs' | 'metrics';
  filters: VerificationStatus[];
  onSetFilters: (filters: VerificationStatus[]) => void;
}> = ({ type, filters, onSetFilters }) => {
  const title = type === 'logs' ? 'Logs' : 'Metrics';
  const showFilters: boolean = true;

  return (
    <AppContentHeader>
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center space-x-2">
          <Text>{title}</Text>
          {showFilters && (
            <MetricsFilters type={type} filters={filters} onSetFilters={onSetFilters} />
          )}
        </div>
      </div>
    </AppContentHeader>
  );
};

const options = [
  {
    label: 'All',
    value: 'all'
  },
  {
    label: 'Requested',
    value: VerificationStatus.requested
  },
  {
    label: 'Verified',
    value: VerificationStatus.verified
  }
];

const MetricsFilters: React.FC<{
  type: 'logs' | 'metrics';
  filters: VerificationStatus[];
  onSetFilters: (filters: VerificationStatus[]) => void;
}> = React.memo(({ type, filters, onSetFilters }) => {
  const selectedOption = useMemo(() => {
    return (
      options.find((option) => {
        return filters.includes(option.value as VerificationStatus);
      }) || options[0]
    );
  }, [filters]);

  const onChange = useMemoizedFn((v: SegmentedValue) => {
    if (v === 'all') {
      onSetFilters([]);
    } else {
      onSetFilters([v as VerificationStatus]);
    }
  });

  return <AppSegmented value={selectedOption?.value} options={options} onChange={onChange} />;
});
MetricsFilters.displayName = 'MetricsFilters';
