import type { CurrencyResponse } from '@buster/server-shared/dictionary';
import type { ColorPaletteDictionariesResponse } from '@buster/server-shared/dictionary';
import { queryOptions } from '@tanstack/react-query';

export const colorPalettes = queryOptions<ColorPaletteDictionariesResponse>({
  queryKey: ['dictionaries', 'color-palettes', 'list'] as const,
  initialData: [],
  initialDataUpdatedAt: 0,
  staleTime: 1000 * 60 * 60 * 1 // 1 hour
});

export const getCurrencies = queryOptions<CurrencyResponse>({
  queryKey: ['dictionaries', 'currencies', 'list'] as const,
  initialData: [],
  initialDataUpdatedAt: 0,
  staleTime: 1000 * 60 * 60 * 24 * 7 // 7 days
});

export const dictionariesQueryKeys = {
  colorPalettes,
  getCurrencies
};
