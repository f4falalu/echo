import { z } from 'zod';
import { OrganizationColorPaletteSchema } from './organization.types';

// Update Organization Request/Response Types
export const UpdateOrganizationRequestSchema = z.object({
  organizationColorPalettes: z.object({
    selectedId: z.string(),
    palettes: z.array(OrganizationColorPaletteSchema),
  }),
});

export type UpdateOrganizationRequest = z.infer<typeof UpdateOrganizationRequestSchema>;
