import React from 'react';
import { LabelAndInput } from '../../Common';
import { LoopTrendline } from './EditTrendline';
import { Slider } from '@/components/ui/slider';

interface TrendlineLabelPositionOffsetProps {
  trend: LoopTrendline;
  onUpdateExisitingTrendline: (trend: LoopTrendline) => void;
}

export const TrendlineLabelPositionOffset: React.FC<TrendlineLabelPositionOffsetProps> = React.memo(
  ({ trend, onUpdateExisitingTrendline }) => {
    const handleChange = (value: number[]) => {
      onUpdateExisitingTrendline({
        ...trend,
        trendlineLabelPositionOffset: value[0]
      });
    };

    return (
      <LabelAndInput label="Label Position">
        <div className="w-full px-2">
          <Slider
            defaultValue={[trend.trendlineLabelPositionOffset ?? 0.85]}
            step={0.01}
            min={0}
            max={1}
            onValueChange={handleChange}
          />
        </div>
      </LabelAndInput>
    );
  }
);

TrendlineLabelPositionOffset.displayName = 'TrendlineLabelPositionOffset';
