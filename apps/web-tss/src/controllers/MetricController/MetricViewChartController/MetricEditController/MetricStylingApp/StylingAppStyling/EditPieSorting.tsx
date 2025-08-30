import type { ChartConfigProps, PieSortBy } from '@buster/server-shared/metrics';
import React, { useMemo } from 'react';
import Empty from '@/components/ui/icons/NucleoIconOutlined/empty';
import SortAlphaAscending from '@/components/ui/icons/NucleoIconOutlined/sort-alpha-ascending';
import SortNumAscending from '@/components/ui/icons/NucleoIconOutlined/sort-num-ascending';
import { AppSegmented, type SegmentedItem } from '@/components/ui/segmented';
import { LabelAndInput } from '../Common';

const options: SegmentedItem<NonNullable<PieSortBy> | 'none'>[] = [
  {
    icon: <SortNumAscending />,
    value: 'value',
    tooltip: 'Sort by value',
  },
  {
    value: 'key',
    tooltip: 'Sort by key',
    icon: <SortAlphaAscending />,
  },
  {
    icon: <Empty />,
    value: 'none',
    tooltip: 'No sorting',
  },
];

export const EditPieSorting: React.FC<{
  pieSortBy: ChartConfigProps['pieSortBy'];
  onUpdateChartConfig: (v: Partial<ChartConfigProps>) => void;
}> = React.memo(({ pieSortBy, onUpdateChartConfig }) => {
  const selectedOption = useMemo(() => {
    return (
      options.find((option) => {
        return pieSortBy === option.value;
      })?.value || 'none'
    );
  }, [pieSortBy]);

  const onChange = (value: SegmentedItem<NonNullable<PieSortBy> | 'none'>) => {
    if (value.value === 'none') {
      onUpdateChartConfig({ pieSortBy: null });
    } else {
      onUpdateChartConfig({ pieSortBy: value.value });
    }
  };

  return (
    <LabelAndInput label="Sorting">
      <div className="flex justify-end">
        <AppSegmented options={options} value={selectedOption} onChange={onChange} type="button" />
      </div>
    </LabelAndInput>
  );
});
EditPieSorting.displayName = 'EditPieSorting';
