import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { docs } from '../../schema';

export const DeleteDocParamsSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
});

export type DeleteDocParams = z.infer<typeof DeleteDocParamsSchema>;

export async function deleteDoc(params: DeleteDocParams) {
  // Validate params at runtime
  const { id, organizationId } = DeleteDocParamsSchema.parse(params);

  // Soft delete by setting deletedAt
  const [deletedDoc] = await db
    .update(docs)
    .set({
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(docs.id, id), eq(docs.organizationId, organizationId), isNull(docs.deletedAt)))
    .returning();

  return deletedDoc || null;
}
