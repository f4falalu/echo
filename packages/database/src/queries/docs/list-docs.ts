import { and, eq, isNull, like, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { docs } from '../../schema';

export const ListDocsParamsSchema = z.object({
  organizationId: z.string().uuid(),
  type: z.enum(['analyst', 'normal']).optional(),
  search: z.string().optional(),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
});

export type ListDocsParams = z.infer<typeof ListDocsParamsSchema>;

export async function listDocs(params: ListDocsParams) {
  // Validate params at runtime
  const validatedParams = ListDocsParamsSchema.parse(params);
  const { organizationId, type, search, page = 1, pageSize = 20 } = validatedParams;

  const offset = (page - 1) * pageSize;

  // Build where conditions
  const conditions = [eq(docs.organizationId, organizationId), isNull(docs.deletedAt)];

  if (type) {
    conditions.push(eq(docs.type, type));
  }

  if (search) {
    conditions.push(like(docs.name, `%${search}%`));
  }

  // Get total count
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(docs)
    .where(and(...conditions));

  const count = countResult?.count ?? 0;

  // Get paginated results
  const results = await db
    .select()
    .from(docs)
    .where(and(...conditions))
    .orderBy(docs.updatedAt)
    .limit(pageSize)
    .offset(offset);

  return {
    data: results,
    total: count,
    page,
    pageSize,
    totalPages: Math.ceil(count / pageSize),
  };
}
