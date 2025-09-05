import React, { useRef } from 'react';
import { Button } from '@/components/ui/buttons';
import { Plus } from '../../../ui/icons';
import { type IColorPalette, ThemeList } from '../ThemeList';
import { AddThemeProviderWrapper, useAddTheme } from './AddThemeProviderWrapper';
import { EditCustomThemeMenu } from './EditCustomThemeMenu';
import { NewThemePopup } from './NewThemePopup';

interface AddCustomThemeBaseProps {
  customThemes: Omit<IColorPalette, 'selected'>[];
  selectedThemeId: string | null;
  onSelectTheme: (theme: IColorPalette) => void;
  createCustomTheme: (theme: IColorPalette) => Promise<void>;
  deleteCustomTheme: (themeId: string) => Promise<void>;
  modifyCustomTheme: (themeId: string, theme: IColorPalette) => Promise<void>;
}

export const AddCustomThemeBase = React.memo(
  ({
    customThemes,
    selectedThemeId,
    onSelectTheme,
    createCustomTheme,
    deleteCustomTheme,
    modifyCustomTheme,
  }: AddCustomThemeBaseProps) => {
    const iThemes: IColorPalette[] = customThemes.map((theme) => ({
      ...theme,
      selected: theme.id === selectedThemeId,
    }));

    return (
      <AddThemeProviderWrapper
        createCustomTheme={createCustomTheme}
        deleteCustomTheme={deleteCustomTheme}
        modifyCustomTheme={modifyCustomTheme}
      >
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

const AddCustomThemeButton: React.FC = () => {
  const { createCustomTheme } = useAddTheme();
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <NewThemePopup
      onSave={createCustomTheme}
      selectedTheme={undefined}
      onDelete={undefined}
      onUpdate={undefined}
    >
      <Button ref={buttonRef} variant={'ghost'} size={'tall'} prefix={<Plus />}>
        Add a custom theme
      </Button>
    </NewThemePopup>
  );
};

AddCustomThemeButton.displayName = 'AddCustomThemeButton';
