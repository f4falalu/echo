import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { docs } from '../../schema';

export const UpsertDocSchema = z.object({
  name: z.string().min(1).max(255),
  content: z.string(),
  type: z.enum(['analyst', 'normal']),
  organizationId: z.string().uuid(),
});

export type UpsertDocParams = z.infer<typeof UpsertDocSchema>;

export async function upsertDoc(params: UpsertDocParams) {
  // Validate params at runtime
  const validatedParams = UpsertDocSchema.parse(params);
  const { name, content, type = 'normal', organizationId } = validatedParams;

  try {
    // Update existing doc and unmark deleted_at if it was soft deleted
    const [updatedDoc] = await db
      .insert(docs)
      .values({
        name,
        content,
        type,
        organizationId,
        updatedAt: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: [docs.name, docs.organizationId],
        set: {
          content,
          type,
          updatedAt: new Date().toISOString(),
          deletedAt: null, // Unmark soft delete
        },
      })
      .returning();

    return updatedDoc;
  } catch (error) {
    console.error('Error upserting doc:', error);
    throw new Error('Failed to upsert doc');
  }
}
