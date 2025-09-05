import type {
  ColorPaletteDictionariesResponse,
  CurrencyResponse,
} from '@buster/server-shared/dictionary';
import { mainApiV2 } from '../instances';

export const getColorPalettes = async () => {
  return await mainApiV2
    .get<ColorPaletteDictionariesResponse>('/dictionaries/color-palettes')
    .then((res) => res.data);
};

export const getCurrencies = async () => {
  return await mainApiV2.get<CurrencyResponse>('/dictionaries/currency').then((res) => res.data);
};
