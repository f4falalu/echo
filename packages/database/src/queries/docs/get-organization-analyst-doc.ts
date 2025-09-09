import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { docs } from '../../schema';

export const GetOrganizationAnalystDocParamsSchema = z.object({
  organizationId: z.string().uuid(),
});

export type GetOrganizationAnalystDocParams = z.infer<typeof GetOrganizationAnalystDocParamsSchema>;

export async function getOrganizationAnalystDoc(
  params: GetOrganizationAnalystDocParams
): Promise<string | null> {
  const validatedParams = GetOrganizationAnalystDocParamsSchema.parse(params);
  const { organizationId } = validatedParams;

  const result = await db
    .select({
      content: docs.content,
    })
    .from(docs)
    .where(
      and(eq(docs.organizationId, organizationId), eq(docs.type, 'analyst'), isNull(docs.deletedAt))
    )
    .limit(1);

  return result[0]?.content ?? null;
}
