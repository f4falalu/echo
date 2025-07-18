// Organization Color Palette Types
export type OrganizationColorPalette = {
  id: string;
  colors: string[]; // Hex color codes
  name: string;
};

export type OrganizationColorPalettes = {
  selectedId: string | null;
  palettes: OrganizationColorPalette[];
  selectedDictionaryPalette: OrganizationColorPalette | null;
};
