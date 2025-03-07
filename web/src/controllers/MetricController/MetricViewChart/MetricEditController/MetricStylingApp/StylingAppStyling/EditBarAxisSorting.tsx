import { IBusterMetricChartConfig } from '@/api/asset_interfaces';
import React, { useMemo } from 'react';
import { LabelAndInput } from '../Common';
import { BarSortBy } from '@/components/ui/charts';
import { AppSegmented, SegmentedItem } from '@/components/ui/segmented';
import { ChartBarAxisX, ChartBarTrendDown, ChartBarTrendUp } from '@/components/ui/icons';
import { useMemoizedFn } from '@/hooks';

const options: SegmentedItem<BarSortBy[0]>[] = [
  {
    label: 'None',
    value: 'none',
    tooltip: 'No sorting',
    icon: <ChartBarAxisX />
  },
  {
    icon: <ChartBarTrendUp />,
    value: 'asc',
    tooltip: 'Sort ascending'
  },
  {
    icon: <ChartBarTrendDown />,
    value: 'desc',
    tooltip: 'Sort descending'
  }
];

export const EditBarSorting: React.FC<{
  barSortBy: IBusterMetricChartConfig['barSortBy'];
  onUpdateChartConfig: (v: Partial<IBusterMetricChartConfig>) => void;
}> = React.memo(({ barSortBy, onUpdateChartConfig }) => {
  const selectedOption = useMemo(() => {
    return (
      options.find((option) => {
        return barSortBy.includes(option.value);
      })?.value || 'none'
    );
  }, [barSortBy]);

  const onChange = useMemoizedFn((value: SegmentedItem<'none' | 'asc' | 'desc'>) => {
    onUpdateChartConfig({ barSortBy: [value.value] });
  });

  return (
    <LabelAndInput label="Sorting">
      <AppSegmented options={options} value={selectedOption} onChange={onChange} block />
    </LabelAndInput>
  );
});
EditBarSorting.displayName = 'EditBarSorting';
