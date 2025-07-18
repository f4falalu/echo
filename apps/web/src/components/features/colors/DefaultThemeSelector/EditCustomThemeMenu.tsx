import React from 'react';
import type { IColorPalette } from '../ThemeList';
import { useMemoizedFn } from '@/hooks';
import { NewThemePopup } from './NewThemePopup';
import { useAddTheme } from './AddThemeProviderWrapper';

export const EditCustomThemeMenu: React.FC<{ theme: IColorPalette }> = React.memo(({ theme }) => {
  const { deleteCustomTheme, modifyCustomTheme } = useAddTheme();

  const onSave = useMemoizedFn(async (theme: IColorPalette) => {
    await modifyCustomTheme(theme.id, theme);
  });

  const onDelete = useMemoizedFn(async (themeId: string) => {
    await deleteCustomTheme(themeId);
  });

  const onUpdate = useMemoizedFn(async (theme: IColorPalette) => {
    await modifyCustomTheme(theme.id, theme);
  });

  return (
    <NewThemePopup selectedTheme={theme} onSave={onSave} onDelete={onDelete} onUpdate={onUpdate} />
  );
});

EditCustomThemeMenu.displayName = 'EditCustomThemeMenu';
