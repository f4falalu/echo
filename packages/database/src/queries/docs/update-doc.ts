import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../connection';
import { docs } from '../../schema';

export interface UpdateDocParams {
  id: string;
  organizationId: string;
  name?: string;
  content?: string;
  type?: 'analyst' | 'normal';
}

export async function updateDoc(params: UpdateDocParams) {
  const { id, organizationId, ...updates } = params;

  // Filter out undefined values
  const updateData: Record<string, string> = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.content !== undefined) updateData.content = updates.content;
  if (updates.type !== undefined) updateData.type = updates.type;

  // Always update updatedAt
  updateData.updatedAt = new Date().toISOString();

  const [updatedDoc] = await db
    .update(docs)
    .set(updateData)
    .where(and(eq(docs.id, id), eq(docs.organizationId, organizationId), isNull(docs.deletedAt)))
    .returning();

  return updatedDoc || null;
}
