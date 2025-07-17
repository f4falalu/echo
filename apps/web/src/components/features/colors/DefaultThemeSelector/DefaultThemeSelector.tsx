import React from 'react';
import { DefaultThemeSelectorBase } from './DefaultThemeSelectorBase';
import { useGetMyUserInfo } from '@/api/buster_rest/users/queryRequests';
import { useUpdateOrganization } from '@/api/buster_rest/organizations/queryRequests';
import type { IColorTheme } from '../ThemeList';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { useColorThemes } from '@/api/buster_rest/dictionaries';
import { StatusCard } from '@/components/ui/card/StatusCard';
import { CircleSpinnerLoader } from '../../../ui/loaders';

export const DefaultThemeSelector = React.memo(() => {
  const { data: userData } = useGetMyUserInfo();
  const { data: themes, isFetched: isFetchedThemes, isError: isErrorThemes } = useColorThemes();
  const { mutateAsync: updateOrganization } = useUpdateOrganization();

  const organization = userData?.organizations?.[0]!;

  const onCreateCustomTheme = useMemoizedFn(async (theme: IColorTheme) => {
    const currentThemeId = organization.organizationColorPalettes.selectedId;
    await updateOrganization({
      organizationColorPalettes: {
        selectedId: currentThemeId || theme.id,
        palettes: [...organization.organizationColorPalettes.palettes, theme]
      }
    });
  });

  const onDeleteCustomTheme = useMemoizedFn(async (themeId: string) => {
    const currentThemeId = organization.organizationColorPalettes.selectedId;
    const isSelectedTheme = currentThemeId === themeId;
    const firstTheme = organization.organizationColorPalettes.palettes[0];

    await updateOrganization({
      organizationColorPalettes: {
        selectedId: isSelectedTheme ? firstTheme.id : currentThemeId,
        palettes: organization.organizationColorPalettes.palettes.filter(
          (theme) => theme.id !== themeId
        )
      }
    });
  });

  const onModifyCustomTheme = useMemoizedFn(async (themeId: string, theme: IColorTheme) => {
    await updateOrganization({
      organizationColorPalettes: {
        selectedId: organization.organizationColorPalettes.selectedId,
        palettes: organization.organizationColorPalettes.palettes.map((t) =>
          t.id === themeId ? theme : t
        )
      }
    });
  });

  const onSelectTheme = useMemoizedFn((theme: IColorTheme) => {
    updateOrganization({
      organizationColorPalettes: {
        selectedId: theme.id,
        palettes: organization.organizationColorPalettes.palettes
      }
    });
  });

  const organizationColorPalettes = organization?.organizationColorPalettes;

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
    />
  );
});

DefaultThemeSelector.displayName = 'DefaultThemeSelector';
