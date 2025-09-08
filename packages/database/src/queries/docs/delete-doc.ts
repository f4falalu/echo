import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../connection';
import { docs } from '../../schema';

export interface DeleteDocParams {
  id: string;
  organizationId: string;
}

export async function deleteDoc(params: DeleteDocParams) {
  const { id, organizationId } = params;

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
