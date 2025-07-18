import { useGetMyUserInfo } from '@/api/buster_rest/users/queryRequests';
import type { ColorPalette } from '@buster/server-shared/organization';
import { useMemo } from 'react';
import { useColorDictionaryThemes } from '../api/buster_rest/dictionaries';
import { DEFAULT_CHART_THEME } from '@buster/server-shared/metrics';
import { useGetCurrencies } from '../api/buster_rest/dictionaries';

const useGetOrganizationPalettes = () => {
  const { data: userData } = useGetMyUserInfo();

  const organization = userData?.organizations?.[0];
  const organizationPalettes: ColorPalette[] =
    organization?.organizationColorPalettes.palettes || [];
  const selectedPaletteId = organization?.organizationColorPalettes.selectedId;

  return useMemo(() => {
    const defaultOrganizationPalette = organizationPalettes.find(
      (palette) => palette.id === selectedPaletteId
    );

    return {
      organizationPalettes,
      selectedPaletteId: selectedPaletteId || null,
      defaultOrganizationPalette
    };
  }, [organizationPalettes, selectedPaletteId]);
};

export const useGetPalettes = () => {
  const { organizationPalettes, selectedPaletteId } = useGetOrganizationPalettes();
  const { data: dictionaryPalettes, isError: isErrorDictionaryPalettes } =
    useColorDictionaryThemes();
  const { data: currencies } = useGetCurrencies();

  console.log(currencies, dictionaryPalettes);

  return useMemo(() => {
    const allPalettes = [...dictionaryPalettes, ...organizationPalettes];
    const defaultPalette = allPalettes.find((palette) => palette.id === selectedPaletteId);

    return {
      allPalettes,
      organizationPalettes,
      dictionaryPalettes,
      selectedPaletteId,
      defaultPalette,

      isErrorDictionaryPalettes
    };
  }, [dictionaryPalettes, organizationPalettes, selectedPaletteId]);
};

export const useSelectedColorPalette = (colors: string[] | undefined | null): string[] => {
  const { defaultOrganizationPalette } = useGetOrganizationPalettes();

  return useMemo(
    () => colors || defaultOrganizationPalette?.colors || DEFAULT_CHART_THEME,
    [colors, defaultOrganizationPalette]
  );
};
