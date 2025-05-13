import React, { useState } from 'react';
import { LabelAndInput } from '../../Common';
import { LoopTrendline } from './EditTrendline';
import { useMemoizedFn } from '@/hooks';
import { Slider } from '@/components/ui/slider';

interface TrendlineOffsetProps {
  trend: LoopTrendline;
  onUpdateExisitingTrendline: (trend: LoopTrendline) => void;
}

export const TrendlineOffset: React.FC<TrendlineOffsetProps> = React.memo(
  ({ trend, onUpdateExisitingTrendline }) => {
    const [value, setValue] = useState(trend.offset ?? 0);
    useEffect(() => {
      setValue(trend.offset ?? 0);
    }, [trend.offset]);

    const onChange = useMemoizedFn((value: number[]) => {
      onUpdateExisitingTrendline({ ...trend, offset: value[0] });
      setValue(value[0]);
    });

    return (
      <LabelAndInput label="Label offset">
        <div className="flex w-full justify-end">
          <Slider value={[value]} min={-75} max={75} step={1} onValueChange={onChange} />
        </div>
      </LabelAndInput>
    );
  }
);

TrendlineOffset.displayName = 'TrendlineOffset';
