import type { ColorThemeDictionariesResponse } from '@buster/server-shared/dictionary';
import { mainApiV2 } from '../instances';

export const getColorThemes = async () => {
  return await mainApiV2
    .get<ColorThemeDictionariesResponse>('/dictionaries/color-themes')
    .then((res) => res.data);
};
