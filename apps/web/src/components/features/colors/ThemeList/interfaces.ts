import type { OrganizationColorPalette } from '@buster/server-shared/organization';

export type IColorTheme = OrganizationColorPalette & {
  selected?: boolean;
};
