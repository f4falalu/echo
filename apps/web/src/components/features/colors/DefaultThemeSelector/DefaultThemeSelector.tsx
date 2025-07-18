import React from 'react';
import { DefaultThemeSelectorBase } from './DefaultThemeSelectorBase';
import { useGetMyUserInfo } from '@/api/buster_rest/users/queryRequests';
import { useUpdateOrganization } from '@/api/buster_rest/organizations/queryRequests';
import type { IColorTheme } from '../ThemeList';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { useColorThemes } from '@/api/buster_rest/dictionaries';
import { StatusCard } from '@/components/ui/card/StatusCard';
import { CircleSpinnerLoader } from '../../../ui/loaders';
import { useThemeOperations } from '../useThemeOperations';

export const DefaultThemeSelector = React.memo(
  ({ className, themeListClassName }: { className?: string; themeListClassName?: string }) => {
    const { data: userData } = useGetMyUserInfo();
    const { data: themes, isFetched: isFetchedThemes, isError: isErrorThemes } = useColorThemes();
    const { mutateAsync: updateOrganization } = useUpdateOrganization();

    const { onCreateCustomTheme, onDeleteCustomTheme, onModifyCustomTheme, onSelectTheme } = useThemeOperations();

    const organization = userData?.organizations?.[0];
    const organizationColorPalettes = organization?.organizationColorPalettes;


    if (!organizationColorPalettes || !organization) return null;

    if (!isFetchedThemes) return <CircleSpinnerLoader />;

    if (isErrorThemes)
      return (
        <StatusCard
          title="Error fetching themes"
          message="Something went wrong fetching the themes. Please try again later."
          variant="danger"
        />
      );

    return (
      <DefaultThemeSelectorBase
        customThemes={organizationColorPalettes.palettes}
        selectedThemeId={organizationColorPalettes.selectedId}
        themes={themes || []}
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
