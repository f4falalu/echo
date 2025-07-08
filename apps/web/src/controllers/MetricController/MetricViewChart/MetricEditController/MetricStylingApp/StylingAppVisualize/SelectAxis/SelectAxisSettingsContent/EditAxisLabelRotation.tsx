import React, { useMemo } from 'react';
import type { ChartConfigProps } from '@buster/server-shared/metrics';
import { AppSegmented, type SegmentedItem } from '@/components/ui/segmented';
import { useMemoizedFn } from '@/hooks';
import { LabelAndInput } from '../../../Common/LabelAndInput';

const options: SegmentedItem<ChartConfigProps['xAxisLabelRotation']>[] = [
  { label: 'Auto', value: 'auto' },
  { label: '0°', value: 0 },
  { label: '45°', value: 45 },
  { label: '90°', value: 90 }
];

export const EditAxisLabelRotation: React.FC<{
  xAxisLabelRotation: ChartConfigProps['xAxisLabelRotation'];
  onChangeLabelRotation: (value: ChartConfigProps['xAxisLabelRotation']) => void;
}> = React.memo(({ xAxisLabelRotation, onChangeLabelRotation }) => {
  const selectedOption: ChartConfigProps['xAxisLabelRotation'] = useMemo(() => {
    return (
      options.find((option) => option.value === xAxisLabelRotation)?.value ?? options[0]?.value
    );
  }, [xAxisLabelRotation]);

  const onChange = useMemoizedFn((value: SegmentedItem<string>) => {
    onChangeLabelRotation(value.value as ChartConfigProps['xAxisLabelRotation']);
  });

  return (
    <LabelAndInput label="Axis orientation">
      <AppSegmented
        block
        options={options as SegmentedItem<string>[]}
        value={selectedOption as string}
        onChange={onChange}
      />
    </LabelAndInput>
  );
});
EditAxisLabelRotation.displayName = 'EditAxisLabelRotation';
