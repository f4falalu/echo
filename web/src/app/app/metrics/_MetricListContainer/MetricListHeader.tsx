'use client';

import React, { useMemo } from 'react';
import { AppContentHeader } from '../../../../components/layout/AppContentHeader';
import { Button } from 'antd';
import { AppMaterialIcons, AppSegmented } from '@/components';
import { VerificationStatus } from '@/api/asset_interfaces';
import { Text } from '@/components';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useMemoizedFn } from 'ahooks';
import { SegmentedValue } from 'antd/lib/segmented';

export const MetricListHeader: React.FC<{
  type: 'logs' | 'metrics';
  filters: VerificationStatus[];
  onSetFilters: (filters: VerificationStatus[]) => void;
}> = ({ type, filters, onSetFilters }) => {
  const title = type === 'logs' ? 'Logs' : 'Metrics';
  const onToggleChatsModal = useAppLayoutContextSelector((s) => s.onToggleChatsModal);
  const showFilters: boolean = true;

  const onToggleChatsModalPreflight = useMemoizedFn(() => {
    onToggleChatsModal();
  });

  return (
    <AppContentHeader>
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center space-x-2">
          <Text>{title}</Text>
          {showFilters && (
            <MetricsFilters type={type} filters={filters} onSetFilters={onSetFilters} />
          )}
        </div>
        <div className="flex items-center">
          <Button
            icon={<AppMaterialIcons icon="edit_square" />}
            type="default"
            onClick={onToggleChatsModalPreflight}>
            New Chat
          </Button>
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
