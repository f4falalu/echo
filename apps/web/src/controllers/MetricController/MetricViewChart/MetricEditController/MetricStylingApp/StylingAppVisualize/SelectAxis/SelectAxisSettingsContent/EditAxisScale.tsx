import React from 'react';
import type { ChartConfigProps } from '@buster/server-shared/metrics';
import { Select } from '@/components/ui/select';
import { LabelAndInput } from '../../../Common/LabelAndInput';

const options: { label: string; value: ChartConfigProps['yAxisScaleType'] }[] = [
  { label: 'Linear', value: 'linear' },
  { label: 'Logarithmic', value: 'log' }
];

export const EditAxisScale: React.FC<{
  scaleType: ChartConfigProps['yAxisScaleType'] | ChartConfigProps['y2AxisScaleType'];
  onChangeAxisScale: (value: ChartConfigProps['yAxisScaleType']) => void;
}> = React.memo(({ scaleType, onChangeAxisScale }) => {
  return (
    <LabelAndInput label="Scale">
      <Select items={options} value={scaleType} onChange={onChangeAxisScale} />
    </LabelAndInput>
  );
});
EditAxisScale.displayName = 'EditAxisScale';
