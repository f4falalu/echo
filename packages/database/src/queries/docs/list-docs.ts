import { and, eq, isNull, like, sql } from 'drizzle-orm';
import { db } from '../../connection';
import { docs } from '../../schema';

export interface ListDocsParams {
  organizationId: string;
  type?: 'analyst' | 'normal';
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function listDocs(params: ListDocsParams) {
  const { organizationId, type, search, page = 1, pageSize = 20 } = params;

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
