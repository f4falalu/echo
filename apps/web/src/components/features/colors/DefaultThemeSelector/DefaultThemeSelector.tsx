import React from 'react';
import { StatusCard } from '@/components/ui/card/StatusCard';
import { useGetPalettes } from '@/context/Themes/usePalettes';
import { useThemeOperations } from '@/context/Themes/useThemeOperations';
import { CircleSpinnerLoader } from '../../../ui/loaders';
import { DefaultThemeSelectorBase } from './DefaultThemeSelectorBase';

export const DefaultThemeSelector = React.memo(
  ({ themeListClassName }: { themeListClassName?: string }) => {
    const {
      isErrorDictionaryPalettes,
      organizationPalettes,
      dictionaryPalettes,
      selectedPaletteId,
    } = useGetPalettes();

    const { onCreateCustomTheme, onDeleteCustomTheme, onModifyCustomTheme, onSelectTheme } =
      useThemeOperations();

    if (dictionaryPalettes.length === 0 && !isErrorDictionaryPalettes)
      return (
        <div className="flex h-24 w-full min-w-24 items-center justify-center">
          <CircleSpinnerLoader size={24} />
        </div>
      );

    if (isErrorDictionaryPalettes)
      return (
        <StatusCard
          title="Error fetching themes"
          message="Something went wrong fetching the themes. Please try again later."
          variant="danger"
        />
      );

    return (
      <DefaultThemeSelectorBase
        customThemes={organizationPalettes}
        selectedThemeId={selectedPaletteId}
        themes={dictionaryPalettes || []}
        onCreateCustomTheme={onCreateCustomTheme}
        onDeleteCustomTheme={onDeleteCustomTheme}
        onModifyCustomTheme={onModifyCustomTheme}
        onChangeTheme={onSelectTheme}
        themeListClassName={themeListClassName}
      />
    );
  }
);

DefaultThemeSelector.displayName = 'DefaultThemeSelector';
