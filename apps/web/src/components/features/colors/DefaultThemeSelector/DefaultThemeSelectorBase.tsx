import React, { useMemo } from 'react';
import type { IColorTheme } from '../ThemeList/interfaces';
import { ThemeList } from '../ThemeList';
import { ALL_THEMES } from '@/components/features/colors/themes';
import { cn } from '@/lib/utils';

export interface DefaultThemeSelectorProps {
  customThemes: Omit<IColorTheme, 'selected'>[];
  onChangeTheme: (theme: IColorTheme) => void;
  selectedThemeId: string | null;
  useDefaultThemes?: boolean;
  themeListClassName?: string;
}

export const DefaultThemeSelectorBase = React.memo(
  ({
    customThemes,
    useDefaultThemes = true,
    selectedThemeId,
    onChangeTheme,
    themeListClassName
  }: DefaultThemeSelectorProps) => {
    // Compute the list of themes, optionally including default themes
    const themes = useDefaultThemes ? [...customThemes, ...ALL_THEMES] : customThemes;

    const iThemes: Required<IColorTheme>[] = themes.map((theme) => ({
      ...theme,
      selected: theme.id === selectedThemeId,
      id: theme.name
    }));

    return (
      <div className="flex w-full flex-col space-y-2.5">
        <div>SELECTED</div>
        <div className={cn(themeListClassName)}>
          <ThemeList themes={iThemes} onChangeColorTheme={onChangeTheme} />
        </div>
      </div>
    );
  }
);

DefaultThemeSelectorBase.displayName = 'DefaultThemeSelectorBase';
