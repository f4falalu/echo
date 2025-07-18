import { useGetMyUserInfo } from '@/api/buster_rest/users/queryRequests';
import type { ColorPalette } from '@buster/server-shared/organization';
import { useMemo } from 'react';
import { useColorDictionaryThemes } from '../api/buster_rest/dictionaries';

export const useGetPalettes = () => {
  const { data: userData } = useGetMyUserInfo();
  const {
    data: dictionaryPalettes,
    isFetched: isFetchedDictionaryPalettes,
    isError: isErrorDictionaryPalettes
  } = useColorDictionaryThemes();
  const organization = userData?.organizations?.[0];
  const organizationPalettes: ColorPalette[] =
    organization?.organizationColorPalettes.palettes || [];
  const selectedPaletteId = organization?.organizationColorPalettes.selectedId;

  return useMemo(() => {
    const allPalettes = [...dictionaryPalettes, ...organizationPalettes];
    const defaultPalette = allPalettes.find((palette) => palette.id === selectedPaletteId);

    return {
      allPalettes,
      organizationPalettes,
      dictionaryPalettes,
      selectedPaletteId: selectedPaletteId || null,
      defaultPalette,
      isFetchedDictionaryPalettes,
      isErrorDictionaryPalettes
    };
  }, [dictionaryPalettes, organizationPalettes, selectedPaletteId, isFetchedDictionaryPalettes]);
};
