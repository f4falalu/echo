import React from 'react';
import { LabelAndInput } from '../../Common';
import { LoopTrendline } from './EditTrendline';
import { Switch } from '@/components/ui/switch';

interface TrendlineProjectionProps {
  trend: LoopTrendline;
  onUpdateExisitingTrendline: (trend: LoopTrendline) => void;
}

export const TrendlineProjection: React.FC<TrendlineProjectionProps> = React.memo(
  ({ trend, onUpdateExisitingTrendline }) => {
    // Only show for these regression types
    if (
      ![
        'polynomial_regression',
        'logarithmic_regression',
        'exponential_regression',
        'linear_regression'
      ].includes(trend.type)
    ) {
      return null;
    }

    const handleChange = (checked: boolean) => {
      onUpdateExisitingTrendline({
        ...trend,
        projection: checked
      });
    };

    return (
      <LabelAndInput label="Project Trend">
        <div className="flex w-full justify-end">
          <Switch checked={trend.projection ?? false} onCheckedChange={handleChange} />
        </div>
      </LabelAndInput>
    );
  }
);

TrendlineProjection.displayName = 'TrendlineProjection';
