import React, { useMemo } from 'react';
import { LabelAndInput } from '../Common';
import { Segmented } from 'antd';
import { useMemoizedFn } from 'ahooks';
import { IBusterMetricChartConfig } from '@/api/asset_interfaces';

const options: { label: string; value: IBusterMetricChartConfig['pieDisplayLabelAs'] }[] = [
  { label: '%', value: 'percent' },
  { label: '#', value: 'number' }
];

export const EditShowLabelPieAsPercentage = React.memo(
  ({
    pieDisplayLabelAs,
    onUpdateChartConfig
  }: {
    pieDisplayLabelAs: IBusterMetricChartConfig['pieDisplayLabelAs'];
    onUpdateChartConfig: (config: Partial<IBusterMetricChartConfig>) => void;
  }) => {
    const onClickSegment = useMemoizedFn((value: IBusterMetricChartConfig['pieDisplayLabelAs']) => {
      onUpdateChartConfig({
        pieDisplayLabelAs: value as IBusterMetricChartConfig['pieDisplayLabelAs']
      });
    });

    const selectedValue = useMemo(() => {
      return options.find((option) => option.value === pieDisplayLabelAs)?.value || 'number';
    }, [pieDisplayLabelAs]);

    return (
      <LabelAndInput label="Show label as">
        <div className="flex w-full">
          <Segmented
            className="w-full"
            block
            options={options}
            onChange={onClickSegment}
            defaultValue={selectedValue}
          />
        </div>
      </LabelAndInput>
    );
  },
  () => true
);
EditShowLabelPieAsPercentage.displayName = 'EditShowLabelPieAsPercentage';
