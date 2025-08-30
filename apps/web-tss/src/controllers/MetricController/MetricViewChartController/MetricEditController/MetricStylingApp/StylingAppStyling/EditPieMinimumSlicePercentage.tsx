import type { ChartConfigProps } from '@buster/server-shared/metrics';
import React, { useState } from 'react';
import { SliderWithInputNumber } from '@/components/ui/slider';
import { LabelAndInput } from '../Common';

export const EditPieMinimumSlicePercentage = React.memo(
  ({
    pieMinimumSlicePercentage: initialValue,
    onUpdateChartConfig,
  }: {
    pieMinimumSlicePercentage: ChartConfigProps['pieMinimumSlicePercentage'];
    onUpdateChartConfig: (config: Partial<ChartConfigProps>) => void;
  }) => {
    const [pieMinimumSlicePercentage, setIntermediateValue] = useState(initialValue);

    const onChange = (value: number) => {
      setIntermediateValue(value);
      onUpdateChartConfig({ pieMinimumSlicePercentage: value });
    };

    return (
      <LabelAndInput label="Minimum slice %">
        <SliderWithInputNumber
          min={0}
          max={100}
          value={pieMinimumSlicePercentage}
          onChange={onChange}
        />
      </LabelAndInput>
    );
  }
);
EditPieMinimumSlicePercentage.displayName = 'EditPieMinimumSlicePercentage';
