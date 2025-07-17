import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { organizations } from '../../schema';
import type { OrganizationColorPalettes } from '../../schema-types';

// Hex color validation schema for 3 or 6 digit hex codes
const HexColorSchema = z
  .string()
  .regex(
    /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/,
    'Must be a valid 3 or 6 digit hex color code (e.g., #fff or #ffffff)'
  );

// Organization Color Palette schema
const OrganizationColorPaletteSchema = z.object({
  id: z.string().or(z.number()),
  colors: z.array(HexColorSchema),
});

// Input validation schema
const UpdateOrganizationInputSchema = z.object({
  organizationId: z.string().uuid('Organization ID must be a valid UUID'),
  organizationColorPalettes: z
    .array(OrganizationColorPaletteSchema)
    .optional()
    .refine(
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
});

type UpdateOrganizationInput = z.infer<typeof UpdateOrganizationInputSchema>;

/**
 * Updates organization settings
 * Currently supports updating organization color palettes
 */
export const updateOrganization = async (params: UpdateOrganizationInput): Promise<void> => {
  // Validate and destructure input
  const { organizationId, organizationColorPalettes } = UpdateOrganizationInputSchema.parse(params);

  try {
    // Build update data
    const updateData: {
      updatedAt: string;
      organizationColorPalettes?: OrganizationColorPalettes;
    } = {
      updatedAt: new Date().toISOString(),
    };

    if (organizationColorPalettes !== undefined) {
      updateData.organizationColorPalettes = organizationColorPalettes;
    }

    // Update organization in database
    await db
      .update(organizations)
      .set(updateData)
      .where(and(eq(organizations.id, organizationId), isNull(organizations.deletedAt)));
  } catch (error) {
    console.error('Error updating organization:', {
      organizationId,
      error: error instanceof Error ? error.message : error,
    });

    // Re-throw with more context
    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Failed to update organization');
  }
};
