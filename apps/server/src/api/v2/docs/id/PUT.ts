import type { User } from '@buster/database';
import { getUserOrganizationId, updateDoc } from '@buster/database';
import type { UpdateDocRequest, UpdateDocResponse } from '@buster/server-shared/docs';
import { HTTPException } from 'hono/http-exception';

export async function updateDocHandler(
  docId: string,
  request: UpdateDocRequest,
  user: User
): Promise<UpdateDocResponse> {
  const { name, content, type } = request;

  const userToOrg = await getUserOrganizationId(user.id);

  if (!userToOrg) {
    throw new HTTPException(403, {
      message: 'User is not associated with an organization',
    });
  }

  if (userToOrg.role !== 'workspace_admin' && userToOrg.role !== 'data_admin') {
    throw new HTTPException(403, {
      message: 'User is not an admin',
    });
  }

  const doc = await updateDoc({
    id: docId,
    organizationId: userToOrg.organizationId,
    name,
    content,
    type: type as 'analyst' | 'normal' | undefined,
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
