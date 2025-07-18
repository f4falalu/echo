import type { ColorPalette } from '@buster/server-shared/organization';

export type IColorPalette = ColorPalette & {
  selected?: boolean;
  hideThreeDotMenu?: boolean;
};
