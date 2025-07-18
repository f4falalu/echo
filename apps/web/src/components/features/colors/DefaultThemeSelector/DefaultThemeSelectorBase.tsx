import React from 'react';
import type { IColorTheme } from '../ThemeList/interfaces';
import { ThemeList } from '../ThemeList';
import { cn } from '@/lib/utils';
import { AddCustomThemeBase } from './AddCustomThemeBase';

export interface DefaultThemeSelectorProps {
  customThemes: Omit<IColorTheme, 'selected'>[];
  themes: Omit<IColorTheme, 'selected'>[];
  onChangeTheme: (theme: IColorTheme) => void;
  onCreateCustomTheme: (theme: IColorTheme) => Promise<void>;
  onDeleteCustomTheme: (themeId: string) => Promise<void>;
  onModifyCustomTheme: (themeId: string, theme: IColorTheme) => Promise<void>;
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
    const iThemes: Required<IColorTheme>[] = themes?.map((theme) => ({
      ...theme,
      selected: theme.id === selectedThemeId
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

        <div>
          <ThemeList
            themes={iThemes}
            onChangeColorTheme={onChangeTheme}
            className={cn(themeListClassName)}
          />
        </div>
      </div>
    );
  }
);

DefaultThemeSelectorBase.displayName = 'DefaultThemeSelectorBase';
