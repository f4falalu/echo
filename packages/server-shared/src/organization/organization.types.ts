import type { organizations } from '@buster/database';
import { z } from 'zod';
import type { Equal, Expect } from '../type-utilities';
import { OrganizationRoleSchema } from './roles.types';

// Hex color validation schema for 3 or 6 digit hex codes
const HexColorSchema = z
  .string()
  .regex(
    /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/,
    'Must be a valid 3 or 6 digit hex color code (e.g., #fff or #ffffff)'
  );

export const ColorPalettesSchema = z.object({
  id: z.string(),
  colors: z.array(HexColorSchema).min(1).max(25),
  name: z.string().min(1).max(255),
});

export const OrganizationColorPaletteSchema = z.object({
  selectedId: z.string().nullable(),
  palettes: z.array(ColorPalettesSchema),
  selectedDictionaryPalette: ColorPalettesSchema.nullable().default(null),
});

export const OrganizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  domain: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
  paymentRequired: z.boolean(),
  domains: z.array(z.string()).nullable(),
  restrictNewUserInvitations: z.boolean(),
  defaultRole: OrganizationRoleSchema,
  organizationColorPalettes: OrganizationColorPaletteSchema,
});

export type Organization = z.infer<typeof OrganizationSchema>;
export type OrganizationColorPalette = z.infer<typeof OrganizationColorPaletteSchema>;
export type ColorPalette = z.infer<typeof ColorPalettesSchema>;

type _OrganizationEqualityCheck = Expect<Equal<Organization, typeof organizations.$inferSelect>>;
