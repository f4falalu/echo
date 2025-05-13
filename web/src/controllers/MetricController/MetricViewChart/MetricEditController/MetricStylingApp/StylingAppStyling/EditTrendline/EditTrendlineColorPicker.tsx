import { ColorPicker } from '@/components/ui/color-picker';
import React from 'react';
import { LabelAndInput } from '../../Common';
import { LoopTrendline } from './EditTrendline';
import { useMemoizedFn } from '@/hooks';
import { Switch } from '@/components/ui/switch';

export const TrendlineColorPicker = React.memo(
  ({
    trend,
    onUpdateExisitingTrendline
  }: {
    trend: LoopTrendline;
    onUpdateExisitingTrendline: (trend: LoopTrendline) => void;
  }) => {
    const onChangeComplete = useMemoizedFn((color: string) => {
      const hexColor = color;
      onUpdateExisitingTrendline({ ...trend, trendLineColor: hexColor });
    });

    const handleInheritColorChange = useMemoizedFn((checked: boolean) => {
      onUpdateExisitingTrendline({ ...trend, trendLineColor: checked ? 'inherit' : '#000000' });
    });

    const isInheritColor = trend.trendLineColor === 'inherit';

    return (
      <LabelAndInput label="Color">
        <div className="flex w-full items-center justify-end">
          <ColorPicker
            size="small"
            showInput={!isInheritColor}
            showPicker={!isInheritColor}
            value={trend.trendLineColor || '#000000'}
            onChangeComplete={onChangeComplete}>
            <LabelAndInput label="Inherit color">
              <div className="flex w-full items-center justify-end">
                <Switch checked={isInheritColor} onCheckedChange={handleInheritColorChange} />
              </div>
            </LabelAndInput>
          </ColorPicker>
        </div>
      </LabelAndInput>
    );
  }
);
TrendlineColorPicker.displayName = 'TrendlineColorPicker';
