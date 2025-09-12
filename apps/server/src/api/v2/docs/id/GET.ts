import type { User } from '@buster/database';
import { getDoc, getUserOrganizationId } from '@buster/database';
import type { GetDocResponse } from '@buster/server-shared/docs';
import { HTTPException } from 'hono/http-exception';

export async function getDocHandler(docId: string, user: User): Promise<GetDocResponse> {
  const userToOrg = await getUserOrganizationId(user.id);

  if (!userToOrg) {
    throw new HTTPException(403, {
      message: 'User is not associated with an organization',
    });
  }

  const doc = await getDoc({
    id: docId,
    organizationId: userToOrg.organizationId,
  });

  if (!doc) {
    throw new HTTPException(404, { message: 'Document not found' });
  }

  return {
    id: doc.id,
    name: doc.name,
    content: doc.content,
    type: doc.type as 'analyst' | 'normal',
    organizationId: doc.organizationId,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    deletedAt: doc.deletedAt,
  };
}
