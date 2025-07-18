import React from 'react';
import type { IColorPalette } from '../ThemeList/interfaces';
import { ThemeList } from '../ThemeList';
import { cn } from '@/lib/utils';
import { AddCustomThemeBase } from './AddCustomThemeBase';

export interface DefaultThemeSelectorProps {
  customThemes: Omit<IColorPalette, 'selected'>[];
  themes: Omit<IColorPalette, 'selected'>[];
  onChangeTheme: (theme: IColorPalette) => void;
  onCreateCustomTheme: (theme: IColorPalette) => Promise<void>;
  onDeleteCustomTheme: (themeId: string) => Promise<void>;
  onModifyCustomTheme: (themeId: string, theme: IColorPalette) => Promise<void>;
  selectedThemeId: string | null;
  themeListClassName?: string;
  className?: string;
}

export const DefaultThemeSelectorBase = React.memo(
  ({
    customThemes,
    themes,
    selectedThemeId,
    onChangeTheme,
    themeListClassName,
    className,
    onCreateCustomTheme,
    onDeleteCustomTheme,
    onModifyCustomTheme
  }: DefaultThemeSelectorProps) => {
    const iThemes: Required<IColorPalette>[] = themes?.map((theme) => ({
      ...theme,
      selected: theme.id === selectedThemeId,
      hideThreeDotMenu: false
    }));

    return (
      <div className={cn('flex w-full flex-col space-y-2.5', className)}>
        <AddCustomThemeBase
          customThemes={customThemes}
          selectedThemeId={selectedThemeId}
          onSelectTheme={onChangeTheme}
          createCustomTheme={onCreateCustomTheme}
          deleteCustomTheme={onDeleteCustomTheme}
          modifyCustomTheme={onModifyCustomTheme}
        />

        <ThemeList
          themes={iThemes}
          onChangeColorTheme={onChangeTheme}
          className={cn(themeListClassName)}
        />
      </div>
    );
  }
);

DefaultThemeSelectorBase.displayName = 'DefaultThemeSelectorBase';
