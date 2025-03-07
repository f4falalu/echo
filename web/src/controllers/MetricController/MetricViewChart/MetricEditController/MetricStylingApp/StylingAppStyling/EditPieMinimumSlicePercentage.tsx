import React, { useState } from 'react';
import { LabelAndInput } from '../Common';
import { InputNumber } from '@/components/ui/inputs';
import { Slider } from '@/components/ui/slider';
import { IBusterMetricChartConfig } from '@/api/asset_interfaces';
import { useMemoizedFn } from '@/hooks';

export const EditPieMinimumSlicePercentage = React.memo(
  ({
    pieMinimumSlicePercentage: initialValue,
    onUpdateChartConfig
  }: {
    pieMinimumSlicePercentage: IBusterMetricChartConfig['pieMinimumSlicePercentage'];
    onUpdateChartConfig: (config: Partial<IBusterMetricChartConfig>) => void;
  }) => {
    const [pieMinimumSlicePercentage, setIntermediateValue] = useState(initialValue);

    const onChange = useMemoizedFn((value: number) => {
      setIntermediateValue(value);
      onUpdateChartConfig({ pieMinimumSlicePercentage: value });
    });

    const onChangeSlider = useMemoizedFn((value: number[]) => {
      onChange(value[0]);
    });

    return (
      <LabelAndInput label="Minimum slice %">
        <div className="flex flex-row items-center gap-2">
          <InputNumber
            min={0}
            max={100}
            placeholder="2.5"
            className="max-w-[50px]"
            value={pieMinimumSlicePercentage}
            onChange={(value) => onChange(value || 0)}
          />
          <Slider
            className="w-full"
            min={0}
            max={100}
            value={[pieMinimumSlicePercentage]}
            onValueChange={onChangeSlider}
          />
        </div>
      </LabelAndInput>
    );
  },
  () => {
    return true;
  }
);
EditPieMinimumSlicePercentage.displayName = 'EditPieMinimumSlicePercentage';
