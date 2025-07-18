import isEqual from 'lodash/isEqual';
import React, { useMemo } from 'react';
import type { ChartConfigProps } from '@buster/server-shared/metrics';
import { useMemoizedFn } from '@/hooks';
import type { IColorPalette } from '@/components/features/colors/ThemeList';
import { ThemeList } from '@/components/features/colors/ThemeList';
import { EditCustomThemeMenu } from '@/components/features/colors/DefaultThemeSelector/EditCustomThemeMenu';
import { AddThemeProviderWrapper } from '@/components/features/colors/DefaultThemeSelector/AddThemeProviderWrapper';
import { useThemeOperations } from '@/context-hooks/useThemeOperations';
import { useGetPalettes } from '@/context-hooks/useGetOrganizationPalettes';

export const ColorsApp: React.FC<{
  colors: ChartConfigProps['colors'];
  onUpdateChartConfig: (chartConfig: Partial<ChartConfigProps>) => void;
}> = ({ colors, onUpdateChartConfig }) => {
  const { onCreateCustomTheme, onDeleteCustomTheme, onModifyCustomTheme } = useThemeOperations();
  const { organizationPalettes, dictionaryPalettes } = useGetPalettes();

  const iThemes: Required<IColorPalette>[] = useMemo(() => {
    let hasSelectedTheme = false;
    const organizationThemes = organizationPalettes.map((theme) => {
      const isSelected = isEqual(theme.colors, colors);
      if (isSelected) {
        hasSelectedTheme = true;
      }
      return {
        ...theme,
        selected: isSelected,
        hideThreeDotMenu: false
      };
    });

    const dictionaryThemes = dictionaryPalettes.map((theme) => {
      const isSelected = !hasSelectedTheme && isEqual(theme.colors, colors);
      if (isSelected) {
        hasSelectedTheme = true;
      }
      return {
        ...theme,
        selected: isSelected,
        hideThreeDotMenu: true
      };
    });

    if (!hasSelectedTheme && organizationPalettes.length > 0) {
      organizationThemes[0].selected = true;
    } else if (!hasSelectedTheme && dictionaryPalettes.length > 0) {
      dictionaryThemes[0].selected = true;
    }

    return [...organizationThemes, ...dictionaryThemes];
  }, [dictionaryPalettes, organizationPalettes, colors]);

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
