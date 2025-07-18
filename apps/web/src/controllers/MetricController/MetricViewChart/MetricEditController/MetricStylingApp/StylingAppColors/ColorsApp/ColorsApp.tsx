import isEqual from 'lodash/isEqual';
import React, { useMemo } from 'react';
import type { ChartConfigProps } from '@buster/server-shared/metrics';
import { useMemoizedFn } from '@/hooks';
import type { IColorTheme } from '@/components/features/colors/ThemeList';
import { ThemeList } from '@/components/features/colors/ThemeList';
import { useColorThemes } from '@/api/buster_rest/dictionaries';
import { useGetMyUserInfo, useGetUser } from '@/api/buster_rest/users';
import { EditCustomThemeMenu } from '@/components/features/colors/DefaultThemeSelector/EditCustomThemeMenu';
import { AddThemeProviderWrapper } from '@/components/features/colors/DefaultThemeSelector/AddThemeProviderWrapper';
import { useThemeOperations } from '@/hooks';

export const ColorsApp: React.FC<{
  colors: ChartConfigProps['colors'];
  onUpdateChartConfig: (chartConfig: Partial<ChartConfigProps>) => void;
}> = ({ colors, onUpdateChartConfig }) => {
  const { data: themes } = useColorThemes();
  const { data: userConfig } = useGetMyUserInfo();
  const { onCreateCustomTheme, onDeleteCustomTheme, onModifyCustomTheme } = useThemeOperations();

  const organizationPalettes =
    userConfig?.organizations?.[0]?.organizationColorPalettes?.palettes || [];

  const iThemes: Required<IColorTheme>[] = useMemo(() => {
    const organizationThemes = organizationPalettes.map((theme) => ({
      ...theme,
      selected: isEqual(theme.colors, colors),
      hideThreeDotMenu: false
    }));
    
    const dictionaryThemes = themes.map((theme) => ({
      ...theme,
      selected: isEqual(theme.colors, colors),
      hideThreeDotMenu: true
    }));

    return [...organizationThemes, ...dictionaryThemes];
  }, [themes, organizationPalettes, colors]);

  const onChangeColorTheme = useMemoizedFn((theme: IColorTheme) => {
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
  themes: Required<IColorTheme>[];
  onChangeColorTheme: (theme: IColorTheme) => void;
}> = React.memo(({ themes, onChangeColorTheme }) => {
  return <ThemeList themes={themes} onChangeColorTheme={onChangeColorTheme} themeThreeDotsMenu={EditCustomThemeMenu} />;
});
ColorPicker.displayName = 'ColorPicker';
