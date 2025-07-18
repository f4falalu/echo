import isEqual from 'lodash/isEqual';
import React, { useMemo } from 'react';
import type { ChartConfigProps } from '@buster/server-shared/metrics';
import { useMemoizedFn } from '@/hooks';
import type { IColorPalette } from '@/components/features/colors/ThemeList';
import { ThemeList } from '@/components/features/colors/ThemeList';
import { useColorThemes } from '@/api/buster_rest/dictionaries';
import { useGetMyUserInfo } from '@/api/buster_rest/users';
import { EditCustomThemeMenu } from '@/components/features/colors/DefaultThemeSelector/EditCustomThemeMenu';
import { AddThemeProviderWrapper } from '@/components/features/colors/DefaultThemeSelector/AddThemeProviderWrapper';
import { useThemeOperations } from '@/context-hooks/useThemeOperations';

export const ColorsApp: React.FC<{
  colors: ChartConfigProps['colors'];
  onUpdateChartConfig: (chartConfig: Partial<ChartConfigProps>) => void;
}> = ({ colors, onUpdateChartConfig }) => {
  const { data: themes } = useColorThemes();
  const { data: userConfig } = useGetMyUserInfo();
  const { onCreateCustomTheme, onDeleteCustomTheme, onModifyCustomTheme } = useThemeOperations();

  const organizationPalettes =
    userConfig?.organizations?.[0]?.organizationColorPalettes?.palettes || [];

  const iThemes: Required<IColorPalette>[] = useMemo(() => {
    const organizationThemes = organizationPalettes.map((theme: any) => ({
      ...theme,
      selected: isEqual(theme.colors, colors),
      hideThreeDotMenu: false
    }));

    const dictionaryThemes = themes.map((theme: any) => ({
      ...theme,
      selected: isEqual(theme.colors, colors),
      hideThreeDotMenu: true
    }));

    return [...organizationThemes, ...dictionaryThemes];
  }, [themes, organizationPalettes, colors, userConfig]);

  const onChangeColorTheme = useMemoizedFn((theme: IColorPalette) => {
    onUpdateChartConfig({ colors: theme.colors });
  });

  return (
    <div className="flex flex-col space-y-2">
      <AddThemeProviderWrapper
        createCustomTheme={onCreateCustomTheme}
        deleteCustomTheme={onDeleteCustomTheme}
        modifyCustomTheme={onModifyCustomTheme}>
        <ColorPicker themes={iThemes} onChangeColorTheme={onChangeColorTheme} />
      </AddThemeProviderWrapper>
    </div>
  );
};

const ColorPicker: React.FC<{
  themes: Required<IColorPalette>[];
  onChangeColorTheme: (theme: IColorPalette) => void;
}> = React.memo(({ themes, onChangeColorTheme }) => {
  return (
    <ThemeList
      themes={themes}
      onChangeColorTheme={onChangeColorTheme}
      themeThreeDotsMenu={EditCustomThemeMenu}
    />
  );
});
ColorPicker.displayName = 'ColorPicker';
