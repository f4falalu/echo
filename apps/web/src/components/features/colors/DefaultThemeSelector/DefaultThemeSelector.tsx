import React from 'react';
import { DefaultThemeSelectorBase } from './DefaultThemeSelectorBase';
import { useGetMyUserInfo } from '@/api/buster_rest/users/queryRequests';
import { useUpdateOrganization } from '@/api/buster_rest/organizations/queryRequests';
import type { IColorTheme } from '../ThemeList';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { useColorThemes } from '@/api/buster_rest/dictionaries';
import { StatusCard } from '@/components/ui/card/StatusCard';
import { CircleSpinnerLoader } from '../../../ui/loaders';

export const DefaultThemeSelector = React.memo(
  ({ className, themeListClassName }: { className?: string; themeListClassName?: string }) => {
    const { data: userData } = useGetMyUserInfo();
    const { data: themes, isFetched: isFetchedThemes, isError: isErrorThemes } = useColorThemes();
    const { mutateAsync: updateOrganization } = useUpdateOrganization();

    const organization = userData?.organizations?.[0];
    const organizationColorPalettes = organization?.organizationColorPalettes;


    const onCreateCustomTheme = useMemoizedFn(async (theme: IColorTheme) => {
      if (!organization) return;
      await updateOrganization({
        organizationColorPalettes: {
          selectedId: theme.id,
          palettes: [theme, ...organization.organizationColorPalettes.palettes]
        }
      });
    });

    const onDeleteCustomTheme = useMemoizedFn(async (themeId: string) => {
      if (!organization) return;
      const currentThemeId = organization.organizationColorPalettes.selectedId;
      const isSelectedTheme = currentThemeId === themeId;

      await updateOrganization({
        organizationColorPalettes: {
          selectedId: isSelectedTheme ? null : currentThemeId,
          palettes: organization.organizationColorPalettes.palettes.filter(
            (theme) => theme.id !== themeId
          )
        }
      });
    });

    const onModifyCustomTheme = useMemoizedFn(async (themeId: string, theme: IColorTheme) => {
      if (!organization) return;

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
      if (!organization) return;

      updateOrganization({
        organizationColorPalettes: {
          selectedId: theme.id,
          palettes: organization.organizationColorPalettes.palettes
        }
      });
    });


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
