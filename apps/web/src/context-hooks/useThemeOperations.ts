import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { useGetMyUserInfo } from '@/api/buster_rest/users/queryRequests';
import { useUpdateOrganization } from '@/api/buster_rest/organizations/queryRequests';
import type { IColorPalette } from '@/components/features/colors/ThemeList';

export const useThemeOperations = () => {
  const { data: userData } = useGetMyUserInfo();
  const { mutateAsync: updateOrganization } = useUpdateOrganization();

  const organization = userData?.organizations?.[0];

  const onCreateCustomTheme = useMemoizedFn(async (theme: IColorPalette) => {
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
          (theme: { id: string }) => theme.id !== themeId
        )
      }
    });
  });

  const onModifyCustomTheme = useMemoizedFn(async (themeId: string, theme: IColorPalette) => {
    if (!organization) return;

    await updateOrganization({
      organizationColorPalettes: {
        selectedId: organization.organizationColorPalettes.selectedId,
        palettes: organization.organizationColorPalettes.palettes.map((t: IColorPalette) =>
          t.id === themeId ? theme : t
        )
      }
    });
  });

  const onSelectTheme = useMemoizedFn(async (theme: IColorPalette) => {
    if (!organization) return;

    await updateOrganization({
      organizationColorPalettes: {
        selectedId: theme.id,
        palettes: organization.organizationColorPalettes.palettes
      }
    });
  });

  return {
    onCreateCustomTheme,
    onDeleteCustomTheme,
    onModifyCustomTheme,
    onSelectTheme
  };
};
