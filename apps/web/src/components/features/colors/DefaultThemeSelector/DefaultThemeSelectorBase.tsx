import React, { useMemo } from 'react';
import type { IColorTheme } from '../ThemeList/interfaces';
import { ThemeList } from '../ThemeList';
import { ALL_THEMES } from '@/components/features/colors/themes';
import { cn } from '@/lib/utils';
import { AddCustomThemeBase } from './AddCustomThemeBase';

export interface DefaultThemeSelectorProps {
  customThemes: Omit<IColorTheme, 'selected'>[];
  onChangeTheme: (theme: IColorTheme) => void;
  onCreateCustomTheme: (theme: IColorTheme) => Promise<void>;
  onDeleteCustomTheme: (themeId: string) => Promise<void>;
  onModifyCustomTheme: (themeId: string, theme: IColorTheme) => Promise<void>;
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
    themeListClassName,
    onCreateCustomTheme,
    onDeleteCustomTheme,
    onModifyCustomTheme
  }: DefaultThemeSelectorProps) => {
    // Compute the list of themes, optionally including default themes
    const themes = ALL_THEMES;

    const iThemes: Required<IColorTheme>[] = themes.map((theme) => ({
      ...theme,
      selected: theme.id === selectedThemeId,
      id: theme.name
    }));

    return (
      <div className="flex w-full flex-col space-y-2.5">
        <div>
          <AddCustomThemeBase
            customThemes={customThemes}
            selectedThemeId={selectedThemeId}
            onSelectTheme={onChangeTheme}
            createCustomTheme={onCreateCustomTheme}
            deleteCustomTheme={onDeleteCustomTheme}
            modifyCustomTheme={onModifyCustomTheme}
          />
        </div>
        <div className={cn(themeListClassName)}>
          <ThemeList themes={iThemes} onChangeColorTheme={onChangeTheme} />
        </div>
      </div>
    );
  }
);

DefaultThemeSelectorBase.displayName = 'DefaultThemeSelectorBase';
