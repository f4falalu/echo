import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { docs } from '../../schema';

export const UpdateDocParamsSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  content: z.string().optional(),
  type: z.enum(['analyst', 'normal']).optional(),
});

export type UpdateDocParams = z.infer<typeof UpdateDocParamsSchema>;

export async function updateDoc(params: UpdateDocParams) {
  // Validate params at runtime
  const validatedParams = UpdateDocParamsSchema.parse(params);
  const { id, organizationId, ...updates } = validatedParams;

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
