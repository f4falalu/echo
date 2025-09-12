import { and, eq, isNull, ne } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { docs } from '../../schema';

export const GetOrganizationDocsParamsSchema = z.object({
  organizationId: z.string().uuid(),
});

export type GetOrganizationDocsParams = z.infer<typeof GetOrganizationDocsParamsSchema>;

/**
 * Fetches all non-analyst docs for an organization, ordered by name for consistency
 * These are data catalog documentation files that provide context about the organization's data
 */
export async function getOrganizationDocs(params: GetOrganizationDocsParams) {
  // Validate params at runtime
  const validatedParams = GetOrganizationDocsParamsSchema.parse(params);
  const { organizationId } = validatedParams;

  // Get all docs that are not analyst type, ordered by name for consistency
  const results = await db
    .select({
      id: docs.id,
      name: docs.name,
      content: docs.content,
      type: docs.type,
      updatedAt: docs.updatedAt,
    })
    .from(docs)
    .where(
      and(
        eq(docs.organizationId, organizationId),
        eq(docs.type, 'normal'), // Changed from ne(docs.type, 'analyst') to eq(docs.type, 'normal')
        isNull(docs.deletedAt)
      )
    )
    .orderBy(docs.name); // Order by name for consistent ordering

  return results;
}
