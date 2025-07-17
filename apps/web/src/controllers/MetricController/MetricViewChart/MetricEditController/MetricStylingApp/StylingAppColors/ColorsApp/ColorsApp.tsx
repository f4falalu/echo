import isEqual from 'lodash/isEqual';
import React, { useMemo } from 'react';
import type { ChartConfigProps } from '@buster/server-shared/metrics';
import { useMemoizedFn } from '@/hooks';
import type { IColorTheme } from '@/components/features/colors/ThemeList';
import { ThemeList } from '@/components/features/colors/ThemeList';
import { ALL_THEMES } from '@/components/features/colors/themes';

export const ColorsApp: React.FC<{
  colors: ChartConfigProps['colors'];
  onUpdateChartConfig: (chartConfig: Partial<ChartConfigProps>) => void;
}> = ({ colors, onUpdateChartConfig }) => {
  const onChangeColorTheme = useMemoizedFn((theme: IColorTheme) => {
    onUpdateChartConfig({ colors: theme.colors });
  });

  return (
    <div className="flex flex-col space-y-2">
      <ColorPicker
        selectedSegmentColors={ALL_THEMES}
        colors={colors}
        onChangeColorTheme={onChangeColorTheme}
      />
    </div>
  );
};

const ColorPicker: React.FC<{
  selectedSegmentColors: IColorTheme[];
  colors: ChartConfigProps['colors'];
  onChangeColorTheme: (theme: IColorTheme) => void;
}> = React.memo(({ selectedSegmentColors, colors, onChangeColorTheme }) => {
  const themes = useMemo(() => {
    return selectedSegmentColors.map((theme) => ({
      ...theme,
      selected: isEqual(theme.colors, colors)
    }));
  }, [selectedSegmentColors, colors]);

  return <ThemeList themes={themes} onChangeColorTheme={onChangeColorTheme} />;
});
ColorPicker.displayName = 'ColorPicker';
