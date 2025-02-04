import React from 'react';
import { LabelAndInput } from '../../../Common/LabelAndInput';
import { IBusterMetricChartConfig } from '@/api/asset_interfaces';
import { Select } from 'antd';

const options: { label: string; value: IBusterMetricChartConfig['yAxisScaleType'] }[] = [
  { label: 'Linear', value: 'linear' },
  { label: 'Logarithmic', value: 'log' }
];

export const EditAxisScale: React.FC<{
  scaleType:
    | IBusterMetricChartConfig['yAxisScaleType']
    | IBusterMetricChartConfig['y2AxisScaleType'];
  onChangeAxisScale: (value: IBusterMetricChartConfig['yAxisScaleType']) => void;
}> = React.memo(
  ({ scaleType, onChangeAxisScale }) => {
    return (
      <LabelAndInput label="Scale">
        <Select options={options} defaultValue={scaleType} onChange={onChangeAxisScale} />
      </LabelAndInput>
    );
  },
  (prevProps, nextProps) => {
    return true;
  }
);
EditAxisScale.displayName = 'EditAxisScale';
