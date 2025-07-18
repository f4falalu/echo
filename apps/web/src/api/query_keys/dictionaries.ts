import type { CurrencyResponse } from '@buster/server-shared/dictionary';
import type { ColorThemeDictionariesResponse } from '@buster/server-shared/dictionary';
import { queryOptions } from '@tanstack/react-query';

export const colorThemes = queryOptions<ColorThemeDictionariesResponse>({
  queryKey: ['dictionaries', 'color-themes', 'list'] as const,
  initialData: [],
  initialDataUpdatedAt: 0,
  staleTime: 1000 * 60 * 60 * 24 * 7 // 7 days
});

export const getCurrencies = queryOptions<CurrencyResponse>({
  queryKey: ['dictionaries', 'currencies', 'list'] as const,
  initialData: [],
  initialDataUpdatedAt: 0,
  staleTime: 1000 * 60 * 60 * 24 * 7 // 7 days
});

export const dictionariesQueryKeys = {
  colorThemes,
  getCurrencies
};
