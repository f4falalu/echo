import React, { useRef, type PropsWithChildren } from 'react';
import { ThemeList, type IColorTheme } from '../ThemeList';
import { Button } from '@/components/ui/buttons';
import { Plus } from '../../../ui/icons';
import { NewThemePopup } from './NewThemePopup';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { Popover } from '../../../ui/popover';
import { EditCustomThemeMenu } from './EditCustomThemeMenu';
import { AddThemeProviderWrapper, useAddTheme } from './AddThemeProviderWrapper';

interface AddCustomThemeBaseProps {
  customThemes: Omit<IColorTheme, 'selected'>[];
  selectedThemeId: string | null;
  onSelectTheme: (theme: IColorTheme) => void;
  createCustomTheme: (theme: IColorTheme) => Promise<void>;
  deleteCustomTheme: (themeId: string) => Promise<void>;
  modifyCustomTheme: (themeId: string, theme: IColorTheme) => Promise<void>;
}

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
      selected: theme.id === selectedThemeId
    }));

    return (
      <AddThemeProviderWrapper
        createCustomTheme={createCustomTheme}
        deleteCustomTheme={deleteCustomTheme}
        modifyCustomTheme={modifyCustomTheme}>
        <div className="bg-item-select flex flex-col space-y-1 rounded border p-1">
          {iThemes.length > 0 && (
            <ThemeList
              className="border-none bg-transparent p-0"
              themes={iThemes}
              onChangeColorTheme={onSelectTheme}
              themeThreeDotsMenu={EditCustomThemeMenu}
            />
          )}

          <AddCustomThemeButton />
        </div>
      </AddThemeProviderWrapper>
    );
  }
);

AddCustomThemeBase.displayName = 'AddCustomThemeBase';

const AddCustomThemeButton: React.FC = React.memo(({}) => {
  const { createCustomTheme } = useAddTheme();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const closePopover = useMemoizedFn(() => {
    buttonRef.current?.click();
  });

  const onSave = useMemoizedFn(async (theme: IColorTheme) => {
    await createCustomTheme(theme);
    closePopover();
  });

  return (
    <Popover
      content={<NewThemePopup selectedTheme={undefined} onSave={onSave} onDelete={undefined} />}
      trigger="click"
      className="max-w-[320px] p-0"
      sideOffset={12}>
      <Button ref={buttonRef} variant={'ghost'} size={'tall'} prefix={<Plus />}>
        Add a custom theme
      </Button>
    </Popover>
  );
});

AddCustomThemeButton.displayName = 'AddCustomThemeButton';
