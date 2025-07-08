import isEmpty from 'lodash/isEmpty';
import React from 'react';
import type { ChartConfigProps } from '@buster/server-shared/metrics';
import type { ChartEncodes, ScatterAxis } from '@buster/server-shared/metrics';
import { Slider } from '@/components/ui/slider';
import { useMemoizedFn } from '@/hooks';
import { LabelAndInput } from '../Common';

export const EditScatterDotSize: React.FC<{
  scatterDotSize: ChartConfigProps['scatterDotSize'];
  selectedAxis: ChartEncodes;
  onUpdateChartConfig: (config: Partial<ChartConfigProps>) => void;
}> = React.memo(({ scatterDotSize, selectedAxis, onUpdateChartConfig }) => {
  const hasSize = !isEmpty((selectedAxis as ScatterAxis).size);
  const defaultValue = hasSize ? scatterDotSize : scatterDotSize[0];

  const onChange = useMemoizedFn((v: number[]) => {
    const newLower = v[0];
    const newUpper = hasSize ? v[1] : newLower + 18;
    const arrayFormat: [number, number] = [newLower, newUpper];
    onUpdateChartConfig({
      scatterDotSize: arrayFormat
    });
  });

  const arrayValue = Array.isArray(defaultValue) ? defaultValue : [defaultValue];

  return (
    <LabelAndInput label="Dot size">
      <Slider min={1} max={50} step={1} value={arrayValue} onValueChange={onChange} />
    </LabelAndInput>
  );
});
EditScatterDotSize.displayName = 'EditScatterDotSize';
