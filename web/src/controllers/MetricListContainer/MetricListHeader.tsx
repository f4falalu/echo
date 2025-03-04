'use client';

import React, { useMemo } from 'react';
import { AppSegmented } from '@/components/ui';
import { VerificationStatus } from '@/api/asset_interfaces';
import { Text } from '@/components/ui/typography';
import { useMemoizedFn } from 'ahooks';
import { type SegmentedItem } from '@/components/ui/segmented';

export const MetricListHeader: React.FC<{
  type: 'logs' | 'metrics';
  filters: VerificationStatus[];
  onSetFilters: (filters: VerificationStatus[]) => void;
}> = ({ type, filters, onSetFilters }) => {
  const title = type === 'logs' ? 'Logs' : 'Metrics';
  const showFilters: boolean = true;

  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center space-x-2">
        <Text>{title}</Text>
        {showFilters && (
          <MetricsFilters type={type} filters={filters} onSetFilters={onSetFilters} />
        )}
      </div>
    </div>
  );
};

const options: SegmentedItem<VerificationStatus | 'all'>[] = [
  {
    label: 'All',
    value: 'all'
  },
  {
    label: 'Requested',
    value: VerificationStatus.REQUESTED
  },
  {
    label: 'Verified',
    value: VerificationStatus.VERIFIED
  }
];

const MetricsFilters: React.FC<{
  type: 'logs' | 'metrics';
  filters: VerificationStatus[];
  onSetFilters: (filters: VerificationStatus[]) => void;
}> = React.memo(({ type, filters, onSetFilters }) => {
  const selectedOption: SegmentedItem<VerificationStatus | 'all'> | undefined = useMemo(() => {
    return (
      options.find((option) => {
        return filters.includes(option.value as VerificationStatus);
      }) || options[0]
    );
  }, [filters]);

  const onChange = useMemoizedFn((v: SegmentedItem<VerificationStatus | 'all'>) => {
    if (v.value === 'all') {
      onSetFilters([]);
    } else {
      onSetFilters([v.value as VerificationStatus]);
    }
  });

  return (
    <AppSegmented
      type="button"
      size="default"
      value={selectedOption?.value}
      options={options}
      onChange={onChange}
    />
  );
});
MetricsFilters.displayName = 'MetricsFilters';
