import isEqual from 'lodash/isEqual';
import React, { useMemo } from 'react';
import type { ChartConfigProps } from '@buster/server-shared/metrics';
import { useMemoizedFn } from '@/hooks';
import type { IColorTheme } from '@/components/features/colors/ThemeList';
import { ThemeList } from '@/components/features/colors/ThemeList';
import { useColorThemes } from '@/api/buster_rest/dictionaries';
import { useGetMyUserInfo, useGetUser } from '@/api/buster_rest/users';

export const ColorsApp: React.FC<{
  colors: ChartConfigProps['colors'];
  onUpdateChartConfig: (chartConfig: Partial<ChartConfigProps>) => void;
}> = ({ colors, onUpdateChartConfig }) => {
  const { data: themes } = useColorThemes();
  const { data: userConfig } = useGetMyUserInfo();

  const organizationPalettes =
    userConfig?.organizations?.[0]?.organizationColorPalettes?.palettes || [];

  const iThemes: Required<IColorTheme>[] = useMemo(() => {
    const organizationAndDefaultThemes = [...(organizationPalettes || []), ...themes];

    return organizationAndDefaultThemes.map((theme) => ({
      ...theme,
      selected: isEqual(theme.colors, colors)
    }));
  }, [themes, organizationPalettes, colors]);

  const onChangeColorTheme = useMemoizedFn((theme: IColorTheme) => {
    onUpdateChartConfig({ colors: theme.colors });
  });

  return (
    <div className="flex flex-col space-y-2">
      <ColorPicker themes={iThemes} onChangeColorTheme={onChangeColorTheme} />
    </div>
  );
};

const ColorPicker: React.FC<{
  themes: Required<IColorTheme>[];
  onChangeColorTheme: (theme: IColorTheme) => void;
}> = React.memo(({ themes, onChangeColorTheme }) => {
  return <ThemeList themes={themes} onChangeColorTheme={onChangeColorTheme} />;
});
ColorPicker.displayName = 'ColorPicker';
