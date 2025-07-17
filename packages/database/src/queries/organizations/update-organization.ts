import { type InferSelectModel, and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { organizations } from '../../schema';
import { getUserOrganizationId } from './organizations';

// Organization Color Palette schema
const OrganizationColorPaletteSchema = z.object({
  id: z.string(),
  color: z.array(z.string()),
});

// Input validation schema
const UpdateOrganizationInputSchema = z.object({
  organizationId: z.string().uuid('Organization ID must be a valid UUID'),
  organizationColorPalettes: z.array(OrganizationColorPaletteSchema).optional(),
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
      organizationColorPalettes?: Array<{ id: string; color: string[] }>;
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

    console.info('Organization updated successfully:', {
      organizationId,

      updatedFields: organizationColorPalettes !== undefined ? ['organizationColorPalettes'] : [],
    });
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
