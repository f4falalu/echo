import React, { useMemo } from 'react';
import { LabelAndInput } from '../../../Common/LabelAndInput';
import { IBusterMetricChartConfig } from '@/api/asset_interfaces';
import { Segmented } from 'antd';

const options: { label: string; value: IBusterMetricChartConfig['xAxisLabelRotation'] }[] = [
  { label: 'Auto', value: 'auto' },
  { label: '0°', value: 0 },
  { label: '45°', value: 45 },
  { label: '90°', value: 90 }
];

export const EditAxisLabelRotation: React.FC<{
  xAxisLabelRotation: IBusterMetricChartConfig['xAxisLabelRotation'];
  onChangeLabelRotation: (value: IBusterMetricChartConfig['xAxisLabelRotation']) => void;
}> = React.memo(
  ({ xAxisLabelRotation, onChangeLabelRotation }) => {
    const selectedOption: IBusterMetricChartConfig['xAxisLabelRotation'] = useMemo(() => {
      return (
        options.find((option) => option.value === xAxisLabelRotation)?.value || options[0]?.value!
      );
    }, [xAxisLabelRotation]);

    return (
      <LabelAndInput label="Axis scale">
        <Segmented
          block
          options={options}
          defaultValue={selectedOption}
          onChange={onChangeLabelRotation}
        />
      </LabelAndInput>
    );
  },
  () => {
    return true;
  }
);
EditAxisLabelRotation.displayName = 'EditAxisLabelRotation';
