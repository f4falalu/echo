import React, { type PropsWithChildren } from 'react';
import { ThemeList, type IColorTheme } from '../ThemeList';
import { Button } from '@/components/ui/buttons';
import { Plus } from '../../../ui/icons';
import { NewThemePopup } from './NewThemePopup';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { Popover } from '../../../ui/popover';

interface AddCustomThemeBaseProps {
  customThemes: Omit<IColorTheme, 'selected'>[];
  selectedThemeId: string | null;
  onSelectTheme: (theme: IColorTheme) => void;
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
    onSelectTheme,
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
            onChangeColorTheme={onSelectTheme}
            themeThreeDotsMenu={ThreeDotMenu}
          />

          <AddCustomThemeButton />
        </div>
      </AddThemeProviderWrapper>
    );
  }
);

AddCustomThemeBase.displayName = 'AddCustomThemeBase';

const ThreeDotMenu: React.FC<{ theme: IColorTheme }> = React.memo(({ theme }) => {
  const { deleteCustomTheme, modifyCustomTheme } = useAddTheme();

  const onSave = useMemoizedFn(async (theme: IColorTheme) => {
    await modifyCustomTheme(theme.id, theme);
  });

  const onDelete = useMemoizedFn(async (themeId: string) => {
    await deleteCustomTheme(themeId);
  });

  return <NewThemePopup selectedTheme={theme} onSave={onSave} onDelete={onDelete} />;
});

ThreeDotMenu.displayName = 'ThreeDotMenu';

const AddCustomThemeButton: React.FC<{}> = React.memo(({}) => {
  const { createCustomTheme } = useAddTheme();

  const onSave = useMemoizedFn(async (theme: IColorTheme) => {
    await createCustomTheme(theme);
  });

  return (
    <Popover
      content={<NewThemePopup selectedTheme={undefined} onSave={onSave} onDelete={undefined} />}
      trigger="click"
      className="p-0"
      sideOffset={12}>
      <Button variant={'ghost'} size={'tall'} block prefix={<Plus />}>
        Add a custom theme
      </Button>
    </Popover>
  );
});

AddCustomThemeButton.displayName = 'AddCustomThemeButton';
