import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { collections } from '../../schema';

export const GetCollectionTitleInputSchema = z.object({
  assetId: z.string().uuid(),
  organizationId: z.string().uuid().optional(),
});

export type GetCollectionTitleInput = z.infer<typeof GetCollectionTitleInputSchema>;

// Updated return type to remove null since we now throw an error instead
export async function getCollectionTitle(input: GetCollectionTitleInput): Promise<string> {
  const validated = GetCollectionTitleInputSchema.parse(input);

  const [collection] = await db
    .select({
      name: collections.name,
      organizationId: collections.organizationId,
    })
    .from(collections)
    .where(and(eq(collections.id, validated.assetId), isNull(collections.deletedAt)))
    .limit(1);

  // Throw error instead of returning null
  if (!collection) {
    throw new Error(`Collection with ID ${validated.assetId} not found`);
  }

  // Throw error for permission failure instead of returning null
  if (collection.organizationId !== validated.organizationId) {
    throw new Error(
      `Access denied: Collection with ID ${validated.assetId} does not belong to the specified organization`
    );
  }

  return collection.name;
}
