import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../connection';
import { docs } from '../../schema';

export interface GetDocParams {
  id: string;
  organizationId: string;
}

export async function getDoc(params: GetDocParams) {
  const { id, organizationId } = params;

  const [doc] = await db
    .select()
    .from(docs)
    .where(and(eq(docs.id, id), eq(docs.organizationId, organizationId), isNull(docs.deletedAt)))
    .limit(1);

  return doc || null;
}
