import React from 'react';
import type { IColorTheme } from '../ThemeList';
import { Button } from '@/components/ui/buttons';
import { Input } from '@/components/ui/inputs';
import { Text } from '@/components/ui/typography';

interface AddCustomThemeBaseProps {
  customThemes: Omit<IColorTheme, 'selected'>[];
  selectedThemeId: string | null;
  createCustomTheme: (theme: IColorTheme) => void;
  deleteCustomTheme: (themeId: string) => void;
  modifyCustomTheme: (themeId: string, theme: IColorTheme) => void;
}

export const AddCustomThemeBase = React.memo(
  ({ customThemes, selectedThemeId }: AddCustomThemeBaseProps) => {
    return <div>AddCustomThemeBase</div>;
  }
);

AddCustomThemeBase.displayName = 'AddCustomThemeBase';
