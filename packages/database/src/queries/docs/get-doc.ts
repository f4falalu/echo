import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { docs } from '../../schema';

export const GetDocParamsSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
});

export type GetDocParams = z.infer<typeof GetDocParamsSchema>;

export async function getDoc(params: GetDocParams) {
  // Validate params at runtime
  const { id, organizationId } = GetDocParamsSchema.parse(params);

  const [doc] = await db
    .select()
    .from(docs)
    .where(and(eq(docs.id, id), eq(docs.organizationId, organizationId), isNull(docs.deletedAt)))
    .limit(1);

  return doc || null;
}
