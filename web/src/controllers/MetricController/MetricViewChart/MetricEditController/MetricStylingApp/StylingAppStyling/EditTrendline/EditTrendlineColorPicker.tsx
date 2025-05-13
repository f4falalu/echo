import { ColorPicker } from '@/components/ui/color-picker';
import React, { useMemo } from 'react';
import { LabelAndInput } from '../../Common';
import { LoopTrendline } from './EditTrendline';
import { useMemoizedFn } from '@/hooks';
import { Switch } from '@/components/ui/switch';

export const TrendlineColorPicker = React.memo(
  ({
    trend,
    colors,
    onUpdateExisitingTrendline
  }: {
    trend: LoopTrendline;
    onUpdateExisitingTrendline: (trend: LoopTrendline) => void;
    colors: string[];
  }) => {
    const onChangeComplete = useMemoizedFn((color: string) => {
      const hexColor = color;
      onUpdateExisitingTrendline({ ...trend, trendLineColor: hexColor });
    });

    const handleInheritColorChange = useMemoizedFn((checked: boolean) => {
      onUpdateExisitingTrendline({ ...trend, trendLineColor: checked ? 'inherit' : '#000000' });
    });

    const isInheritColor = trend.trendLineColor === 'inherit';

    const pickerBackgroundImage = useMemo(() => {
      if (isInheritColor) {
        const colorsToUse = colors.slice(0, 4);
        return `repeating-linear-gradient(90deg, ${colorsToUse
          .map((color, index) => `${color} ${index * 25}%, ${color} ${(index + 1) * 25}%`)
          .join(', ')})`;
      }
      return undefined;
    }, [colors, isInheritColor]);

    return (
      <LabelAndInput label="Color">
        <div className="flex w-full items-center justify-end">
          <ColorPicker
            size="small"
            showInput={!isInheritColor}
            showPicker={!isInheritColor}
            pickerBackgroundImage={pickerBackgroundImage}
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
