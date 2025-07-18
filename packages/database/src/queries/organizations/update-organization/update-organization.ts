import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../../connection';
import { organizations } from '../../../schema';
import type { OrganizationColorPalettes } from '../../../schema-types';
import { OrganizationColorPalettesSchema } from './organization-color-palettes';

// Input validation schema
const UpdateOrganizationInputSchema = z.object({
  organizationId: z.string().uuid('Organization ID must be a valid UUID'),
  organizationColorPalettes: OrganizationColorPalettesSchema,
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
