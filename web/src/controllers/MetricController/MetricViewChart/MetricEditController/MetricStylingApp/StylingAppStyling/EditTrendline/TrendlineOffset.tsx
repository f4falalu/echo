import React from 'react';
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
    const handleChange = useMemoizedFn((e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10);

      if (!isNaN(value)) {
        onUpdateExisitingTrendline({
          ...trend,
          offset: value
        });
      }
    });

    return (
      <LabelAndInput label="Label offset">
        <div className="flex w-full justify-end">
          <Slider
            value={[trend.offset ?? 0]}
            min={-75}
            max={75}
            step={1}
            onValueChange={(value) => onUpdateExisitingTrendline({ ...trend, offset: value[0] })}
          />
        </div>
      </LabelAndInput>
    );
  }
);

TrendlineOffset.displayName = 'TrendlineOffset';
