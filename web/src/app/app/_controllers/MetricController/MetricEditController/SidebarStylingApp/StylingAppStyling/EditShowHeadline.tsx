import React, { useMemo } from 'react';
import { Select } from 'antd';
import { IBusterMetricChartConfig } from '@/api/asset_interfaces';
import { LabelAndInput } from '../Common';
import { useMemoizedFn } from 'ahooks';
import first from 'lodash/first';

const options: {
  label: string;
  value: IBusterMetricChartConfig['showLegendHeadline'] | 'false';
}[] = [
  { label: 'None', value: 'false' },
  { label: 'Total', value: 'total' },
  { label: 'Average', value: 'average' },
  { label: 'Median', value: 'median' },
  { label: 'Max', value: 'max' },
  { label: 'Min', value: 'min' },
  { label: 'Current', value: 'current' }
];

const pieOptions: {
  label: string;
  value: IBusterMetricChartConfig['showLegendHeadline'] | 'false';
}[] = [
  { label: 'None', value: 'false' },
  { label: 'Current', value: 'current' }
];

export const EditShowHeadline: React.FC<{
  showLegendHeadline: IBusterMetricChartConfig['showLegendHeadline'];
  onUpdateChartConfig: (config: Partial<IBusterMetricChartConfig>) => void;
  lineGroupType: IBusterMetricChartConfig['lineGroupType'];
  barGroupType: IBusterMetricChartConfig['barGroupType'];
  selectedChartType: IBusterMetricChartConfig['selectedChartType'];
}> = React.memo(
  ({ showLegendHeadline, onUpdateChartConfig, lineGroupType, barGroupType, selectedChartType }) => {
    const isStackPercentage =
      (lineGroupType === 'percentage-stack' && selectedChartType === 'line') ||
      (barGroupType === 'percentage-stack' && selectedChartType === 'bar');

    const allOptions = useMemo(() => {
      if (selectedChartType === 'pie') {
        return pieOptions;
      }
      return options;
    }, [selectedChartType]);

    const selectedHeadline = useMemo(() => {
      if (selectedChartType === 'pie' && showLegendHeadline !== false) {
        return 'current';
      }
      if (!showLegendHeadline) return first(options)?.value;

      return (
        allOptions.find((option) => option.value === showLegendHeadline)?.value ||
        first(allOptions)?.value
      );
    }, [showLegendHeadline, allOptions]);

    const onChange = useMemoizedFn((value: string | false) => {
      if (value === 'false') {
        value = false;
      }

      onUpdateChartConfig({
        showLegend: true,
        showLegendHeadline: value as IBusterMetricChartConfig['showLegendHeadline']
      });
    });

    if (isStackPercentage) {
      return null;
    }

    return (
      <LabelAndInput label="Legend headline">
        <Select
          disabled={isStackPercentage}
          options={allOptions}
          defaultValue={selectedHeadline}
          onChange={onChange}
        />
      </LabelAndInput>
    );
  },
  () => true
);
EditShowHeadline.displayName = 'EditShowHeadline';
