import { useGetMyUserInfo } from '@/api/buster_rest/users/queryRequests';
import type { ColorPalette } from '@buster/server-shared/organization';
import { useMemo } from 'react';
import { useColorDictionaryThemes } from '../api/buster_rest/dictionaries';
import { DEFAULT_CHART_THEME } from '@buster/server-shared/metrics';

const useGetOrganizationPalettes = () => {
  const { data: userData } = useGetMyUserInfo();

  const organization = userData?.organizations?.[0];
  const organizationPalettes: ColorPalette[] =
    organization?.organizationColorPalettes.palettes || [];
  const selectedPaletteId = organization?.organizationColorPalettes.selectedId;
  const selectedDictionaryPalette =
    organization?.organizationColorPalettes.selectedDictionaryPalette;

  return useMemo(() => {
    const defaultOrganizationPalette = organizationPalettes.find(
      (palette) => palette.id === selectedPaletteId
    );

    return {
      organizationPalettes,
      selectedPaletteId: selectedPaletteId || null,
      defaultOrganizationPalette,
      selectedDictionaryPalette
    };
  }, [organizationPalettes, selectedPaletteId, selectedDictionaryPalette]);
};

export const useGetPalettes = () => {
  const { organizationPalettes, selectedPaletteId, selectedDictionaryPalette } =
    useGetOrganizationPalettes();
  const { data: dictionaryPalettes, isError: isErrorDictionaryPalettes } =
    useColorDictionaryThemes();

  return useMemo(() => {
    const allPalettes = [...dictionaryPalettes, ...organizationPalettes];
    const isSelectedDictionaryPalette =
      selectedPaletteId &&
      selectedDictionaryPalette &&
      selectedPaletteId === selectedDictionaryPalette?.id;
    const defaultPalette = isSelectedDictionaryPalette
      ? selectedDictionaryPalette
      : organizationPalettes.find((palette) => palette.id === selectedPaletteId) ||
        dictionaryPalettes[0];

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
  const { defaultPalette } = useGetPalettes();

  return useMemo(
    () => colors || defaultPalette?.colors || DEFAULT_CHART_THEME,
    [colors, defaultPalette]
  );
};
