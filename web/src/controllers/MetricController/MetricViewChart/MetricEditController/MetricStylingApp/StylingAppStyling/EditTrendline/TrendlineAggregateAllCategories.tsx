import React from 'react';
import { LabelAndInput } from '../../Common';
import { LoopTrendline } from './EditTrendline';
import { Switch } from '@/components/ui/switch';

interface TrendlineAggregateAllCategoriesProps {
  trend: LoopTrendline;
  onUpdateExisitingTrendline: (trend: LoopTrendline) => void;
  categoryEncodes: string[] | undefined;
}

export const TrendlineAggregateAllCategories: React.FC<TrendlineAggregateAllCategoriesProps> =
  React.memo(({ trend, onUpdateExisitingTrendline, categoryEncodes }) => {
    const hasCategoryEncodes = categoryEncodes && categoryEncodes.length > 0;

    if (!hasCategoryEncodes) {
      return null;
    }

    const handleChange = (checked: boolean) => {
      onUpdateExisitingTrendline({
        ...trend,
        aggregateAllCategories: checked
      });
    };

    return (
      <LabelAndInput label="Aggregate">
        <div className="flex w-full justify-end">
          <Switch checked={trend.aggregateAllCategories ?? true} onCheckedChange={handleChange} />
        </div>
      </LabelAndInput>
    );
  });

TrendlineAggregateAllCategories.displayName = 'TrendlineAggregateAllCategories';
