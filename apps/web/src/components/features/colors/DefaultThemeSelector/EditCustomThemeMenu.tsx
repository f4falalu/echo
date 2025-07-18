import React from 'react';
import type { IColorTheme } from '../ThemeList';
import { useMemoizedFn } from '@/hooks';
import { NewThemePopup } from './NewThemePopup';
import { useAddTheme } from './AddThemeProviderWrapper';

export const EditCustomThemeMenu: React.FC<{ theme: IColorTheme }> = React.memo(({ theme }) => {
  const { deleteCustomTheme, modifyCustomTheme } = useAddTheme();

  const onSave = useMemoizedFn(async (theme: IColorTheme) => {
    await modifyCustomTheme(theme.id, theme);
  });

  const onDelete = useMemoizedFn(async (themeId: string) => {
    await deleteCustomTheme(themeId);
  });

  const onUpdate = useMemoizedFn(async (theme: IColorTheme) => {
    await modifyCustomTheme(theme.id, theme);
  });

  return (
    <NewThemePopup selectedTheme={theme} onSave={onSave} onDelete={onDelete} onUpdate={onUpdate} />
  );
});

EditCustomThemeMenu.displayName = 'EditCustomThemeMenu';
