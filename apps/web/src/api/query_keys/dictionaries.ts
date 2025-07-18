import type { ColorThemeDictionariesResponse } from '@buster/server-shared/dictionary';
import { queryOptions } from '@tanstack/react-query';

export const colorThemes = queryOptions<ColorThemeDictionariesResponse>({
  queryKey: ['color-themes', 'list'],
  staleTime: 60 * 1000 * 60 * 24 * 3 // 3 days
});

export const dictionariesQueryKeys = {
  colorThemes
};
