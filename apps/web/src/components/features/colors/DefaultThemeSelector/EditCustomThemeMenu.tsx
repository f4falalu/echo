import type React from 'react';
import type { PropsWithChildren } from 'react';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import type { IColorPalette } from '../ThemeList';
import { useAddTheme } from './AddThemeProviderWrapper';
import { NewThemePopup } from './NewThemePopup';

export const EditCustomThemeMenu: React.FC<PropsWithChildren<{ theme: IColorPalette }>> = ({
  theme,
  children,
}) => {
  const { deleteCustomTheme, modifyCustomTheme } = useAddTheme();

  const onSave = useMemoizedFn((theme: IColorPalette) => {
    return modifyCustomTheme(theme.id, theme);
  });

  const onDelete = useMemoizedFn((themeId: string) => {
    return deleteCustomTheme(themeId);
  });

  const onUpdate = useMemoizedFn((theme: IColorPalette) => {
    return modifyCustomTheme(theme.id, theme);
  });

  return (
    <NewThemePopup selectedTheme={theme} onSave={onSave} onDelete={onDelete} onUpdate={onUpdate}>
      {children}
    </NewThemePopup>
  );
};

EditCustomThemeMenu.displayName = 'EditCustomThemeMenu';
