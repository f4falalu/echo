import React from 'react';
import type { IColorTheme } from '../ThemeList/interfaces';
import { ThemeList } from '../ThemeList';
import { cn } from '@/lib/utils';
import { AddCustomThemeBase } from './AddCustomThemeBase';
import { useColorThemes } from '../../../../api/buster_rest/dictionaries';

export interface DefaultThemeSelectorProps {
  customThemes: Omit<IColorTheme, 'selected'>[];
  themes: Omit<IColorTheme, 'selected'>[];
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
    themes,
    useDefaultThemes = true,
    selectedThemeId,
    onChangeTheme,
    themeListClassName,
    onCreateCustomTheme,
    onDeleteCustomTheme,
    onModifyCustomTheme
  }: DefaultThemeSelectorProps) => {
    const iThemes: Required<IColorTheme>[] = themes?.map((theme) => ({
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
