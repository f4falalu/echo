import { z } from 'zod';

export const DEFAULT_COLOR_PALETTE_ID = '__DEFAULT__';

// Hex color validation schema for 3 or 6 digit hex codes
const HexColorSchema = z
  .string()
  .regex(
    /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/,
    'Must be a valid 3 or 6 digit hex color code (e.g., #fff or #ffffff)'
  );

// Organization Color Palette schema
const OrganizationColorPaletteSchema = z.object({
  id: z.string().min(1).max(255),
  colors: z.array(HexColorSchema),
  name: z.string().min(1).max(255),
});

// Organization Color Palettes schema (extracted to its own schema)
export const OrganizationColorPalettesSchema = z
  .object({
    selectedId: z.string().min(1).max(255).nullable(),
    palettes: z.array(OrganizationColorPaletteSchema).refine(
      (palettes) => {
        if (!palettes || palettes.length === 0) return true;
        const ids = palettes.map((palette) => palette.id);
        const uniqueIds = new Set(ids);
        return ids.length === uniqueIds.size;
      },
      {
        message: 'All color palette IDs must be unique',
      }
    ),
  })
  .refine(
    (data) => {
      // If selectedId is null, no validation needed
      console.log('data.selectedId', data.selectedId);
      if (data.selectedId === null || data.selectedId.startsWith(DEFAULT_COLOR_PALETTE_ID)) {
        return true;
      }

      // If selectedId is provided, it must exist in the palettes array
      const paletteIds = data.palettes.map((palette) => palette.id);
      return paletteIds.includes(data.selectedId);
    },
    {
      message:
        'Selected ID must exist in the palettes array or be a default palette from the dictionary endpoint',
      path: ['selectedId'], // Point the error to the selectedId field
    }
  );
