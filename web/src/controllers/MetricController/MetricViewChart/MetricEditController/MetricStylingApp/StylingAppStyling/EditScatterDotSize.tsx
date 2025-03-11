import { IBusterMetricChartConfig } from '@/api/asset_interfaces';
import { ScatterAxis } from '@/api/asset_interfaces/metric/charts';
import { Slider } from '@/components/ui/slider';
import React from 'react';
import isEmpty from 'lodash/isEmpty';
import { useMemoizedFn } from '@/hooks';
import { LabelAndInput } from '../Common';

export const EditScatterDotSize: React.FC<{
  scatterDotSize: IBusterMetricChartConfig['scatterDotSize'];
  scatterAxis: ScatterAxis;
  onUpdateChartConfig: (config: Partial<IBusterMetricChartConfig>) => void;
}> = React.memo(
  ({ scatterDotSize, scatterAxis, onUpdateChartConfig }) => {
    const hasSize = !isEmpty(scatterAxis.size);
    const defaultValue = hasSize ? scatterDotSize : scatterDotSize[0];

    const onChange = useMemoizedFn((v: number[]) => {
      const newLower = v[0];
      const newUpper = hasSize ? v[1] : newLower + 18;
      const arrayFormat: [number, number] = [newLower, newUpper];
      onUpdateChartConfig({
        scatterDotSize: arrayFormat
      });
    });

    return (
      <LabelAndInput label="Dot size">
        <Slider
          min={1}
          max={50}
          step={1}
          defaultValue={defaultValue as number[]}
          onValueChange={onChange}
        />
      </LabelAndInput>
    );
  },
  () => true
);
EditScatterDotSize.displayName = 'EditScatterDotSize';
