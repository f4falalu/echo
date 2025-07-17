import React, { useMemo, type PropsWithChildren } from 'react';
import { ThemeList, type IColorTheme } from '../ThemeList';
import { Button } from '@/components/ui/buttons';
import { Input } from '@/components/ui/inputs';
import { Text } from '@/components/ui/typography';
import { Plus } from '../../../ui/icons';
import type { DropdownItems } from '../../../ui/dropdown';
import { NewThemePopup } from './NewThemePopup';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';

interface AddCustomThemeBaseProps {
  customThemes: Omit<IColorTheme, 'selected'>[];
  selectedThemeId: string | null;
  createCustomTheme: (theme: IColorTheme) => Promise<void>;
  deleteCustomTheme: (themeId: string) => Promise<void>;
  modifyCustomTheme: (themeId: string, theme: IColorTheme) => Promise<void>;
}

const AddThemeProvider = React.createContext<
  Pick<AddCustomThemeBaseProps, 'createCustomTheme' | 'deleteCustomTheme' | 'modifyCustomTheme'>
>({
  createCustomTheme: async () => {},
  deleteCustomTheme: async () => {},
  modifyCustomTheme: async () => {}
});

const AddThemeProviderWrapper: React.FC<
  PropsWithChildren<
    Pick<AddCustomThemeBaseProps, 'createCustomTheme' | 'deleteCustomTheme' | 'modifyCustomTheme'>
  >
> = ({ children, createCustomTheme, deleteCustomTheme, modifyCustomTheme }) => {
  return (
    <AddThemeProvider.Provider value={{ createCustomTheme, deleteCustomTheme, modifyCustomTheme }}>
      {children}
    </AddThemeProvider.Provider>
  );
};

const useAddTheme = () => {
  return React.useContext(AddThemeProvider);
};

export const AddCustomThemeBase = React.memo(
  ({
    customThemes,
    selectedThemeId,
    createCustomTheme,
    deleteCustomTheme,
    modifyCustomTheme
  }: AddCustomThemeBaseProps) => {
    const iThemes: Required<IColorTheme>[] = customThemes.map((theme) => ({
      ...theme,
      selected: theme.id === selectedThemeId,
      id: theme.id
    }));

    return (
      <AddThemeProviderWrapper
        createCustomTheme={createCustomTheme}
        deleteCustomTheme={deleteCustomTheme}
        modifyCustomTheme={modifyCustomTheme}>
        <div className="bg-item-select flex flex-col space-y-1 rounded border p-1">
          <ThemeList
            className="border-none bg-transparent p-0"
            themes={iThemes}
            onChangeColorTheme={() => {}}
            themeThreeDotsMenu={ThreeDotMenu}
          />

          <Button variant={'ghost'} size={'tall'} block prefix={<Plus />}>
            Add a custom theme
          </Button>
        </div>
      </AddThemeProviderWrapper>
    );
  }
);

AddCustomThemeBase.displayName = 'AddCustomThemeBase';

const ThreeDotMenu: React.FC<{ theme: IColorTheme }> = React.memo(({ theme }) => {
  const { createCustomTheme, deleteCustomTheme, modifyCustomTheme } = useAddTheme();

  const onSave = useMemoizedFn(async (theme: IColorTheme) => {
    await createCustomTheme(theme);
  });

  const onDelete = useMemoizedFn(async (themeId: string) => {
    await deleteCustomTheme(themeId);
  });

  return <NewThemePopup selectedTheme={theme} onSave={onSave} onDelete={onDelete} />;
});

ThreeDotMenu.displayName = 'ThreeDotMenu';
