import React from 'react';
import { LabelAndInput } from '../../Common';
import { LoopTrendline } from './EditTrendline';
import { useMemoizedFn } from '@/hooks';

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
          <input
            type="number"
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            value={trend.offset ?? 0}
            onChange={handleChange}
          />
        </div>
      </LabelAndInput>
    );
  }
);

TrendlineOffset.displayName = 'TrendlineOffset';
