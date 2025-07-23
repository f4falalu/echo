import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { collections } from '../../schema';

export const GetCollectionTitleInputSchema = z.object({
  assetId: z.string().uuid(),
  organizationId: z.string().uuid().optional(),
});

export type GetCollectionTitleInput = z.infer<typeof GetCollectionTitleInputSchema>;

export async function getCollectionTitle(input: GetCollectionTitleInput): Promise<string | null> {
  const validated = GetCollectionTitleInputSchema.parse(input);

  const [collection] = await db
    .select({
      name: collections.name,
      organizationId: collections.organizationId,
    })
    .from(collections)
    .where(and(eq(collections.id, validated.assetId), isNull(collections.deletedAt)))
    .limit(1);

  if (!collection) {
    return null;
  }

  if (collection.organizationId !== validated.organizationId) {
    return null;
  }

  return collection.name;
}
