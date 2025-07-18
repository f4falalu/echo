import type { ColorThemeDictionariesResponse } from '@buster/server-shared/dictionary';
import { mainApiV2 } from '../instances';
import type { CurrencyResponse } from '@buster/server-shared/dictionary';

export const getColorThemes = async () => {
  return await mainApiV2
    .get<ColorThemeDictionariesResponse>('/dictionaries/color-themes')
    .then((res) => res.data);
};

export const getCurrencies = async () => {
  return await mainApiV2.get<CurrencyResponse>('/dictionaries/currency').then((res) => res.data);
};
