import React from 'react';
import type { BusterMetricChartConfig } from '@/api/asset_interfaces';
import { Select } from '@/components/ui/select';
import { LabelAndInput } from '../../../Common/LabelAndInput';

const options: { label: string; value: BusterMetricChartConfig['yAxisScaleType'] }[] = [
  { label: 'Linear', value: 'linear' },
  { label: 'Logarithmic', value: 'log' }
];

export const EditAxisScale: React.FC<{
  scaleType: BusterMetricChartConfig['yAxisScaleType'] | BusterMetricChartConfig['y2AxisScaleType'];
  onChangeAxisScale: (value: BusterMetricChartConfig['yAxisScaleType']) => void;
}> = React.memo(({ scaleType, onChangeAxisScale }) => {
  return (
    <LabelAndInput label="Scale">
      <Select items={options} value={scaleType} onChange={onChangeAxisScale} />
    </LabelAndInput>
  );
});
EditAxisScale.displayName = 'EditAxisScale';
