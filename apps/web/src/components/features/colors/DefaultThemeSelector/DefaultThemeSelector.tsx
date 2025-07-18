import React from 'react';
import { DefaultThemeSelectorBase } from './DefaultThemeSelectorBase';
import { useGetMyUserInfo } from '@/api/buster_rest/users/queryRequests';
import { useColorDictionaryThemes } from '@/api/buster_rest/dictionaries';
import { StatusCard } from '@/components/ui/card/StatusCard';
import { CircleSpinnerLoader } from '../../../ui/loaders';
import { useThemeOperations } from '@/context-hooks/useThemeOperations';
import { useGetPalettes } from '@/context-hooks/usePalettes';

export const DefaultThemeSelector = React.memo(
  ({ className, themeListClassName }: { className?: string; themeListClassName?: string }) => {
    const { data: userData } = useGetMyUserInfo();

    const {
      isErrorDictionaryPalettes,
      isFetchedDictionaryPalettes,
      organizationPalettes,
      dictionaryPalettes,
      selectedPaletteId
    } = useGetPalettes();

    const { onCreateCustomTheme, onDeleteCustomTheme, onModifyCustomTheme, onSelectTheme } =
      useThemeOperations();

    if (!isFetchedDictionaryPalettes) return <CircleSpinnerLoader />;

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
