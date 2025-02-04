import { IBusterMetricChartConfig } from '@/api/asset_interfaces';
import React, { useMemo } from 'react';
import { LabelAndInput } from '../Common';
import { Segmented } from 'antd';
import { useEditAppSegmented } from '../StylingAppVisualize/SelectAxis/SelectAxisColumnContent/useEditAppSegmented';
import { BarSortBy } from '@/components/charts';
import { AppMaterialIconIcon, AppMaterialIcons } from '@/components/icons';
import { AppTooltip } from '@/components';

const allOptions: {
  value: BarSortBy[0];
  icon: string;
  tooltip: string;
}[] = [
  {
    icon: 'bar_sort_none',
    value: 'none',
    tooltip: 'No sorting'
  },
  {
    icon: 'bar_sort_asc',
    value: 'asc',
    tooltip: 'Sort ascending'
  },
  {
    icon: 'bar_sort_desc',
    value: 'desc',
    tooltip: 'Sort descending'
  }
];

export const EditBarSorting: React.FC<{
  barSortBy: IBusterMetricChartConfig['barSortBy'];
  onUpdateChartConfig: (v: Partial<IBusterMetricChartConfig>) => void;
}> = React.memo(({ barSortBy, onUpdateChartConfig }) => {
  const options = useMemo(() => {
    return allOptions.map((x) => ({
      label: (
        <AppTooltip mouseEnterDelay={0.75} trigger={'hover'} title={x.tooltip}>
          <div className="flex h-full w-full items-center justify-center">
            <AppMaterialIcons icon={x.icon as AppMaterialIconIcon} data-value={x.value} />
          </div>
        </AppTooltip>
      ),
      value: x.value as BarSortBy[0]
    }));
  }, []);

  const selectedOption = useMemo(() => {
    return (
      options.find((option) => {
        return barSortBy.includes(option.value);
      })?.value || 'none'
    );
  }, [barSortBy]);

  const { onClick } = useEditAppSegmented({
    onClick: (value) => {
      const fiveValues = [0, 1, 2]; //kind of hack for now...
      onUpdateChartConfig({ barSortBy: fiveValues.map((v) => value as BarSortBy[0]) });
    }
  });

  return (
    <LabelAndInput label="Sorting">
      <Segmented options={options} defaultValue={selectedOption} onClick={onClick} block />
    </LabelAndInput>
  );
});
EditBarSorting.displayName = 'EditBarSorting';
