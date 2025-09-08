import type { User } from '@buster/database';
import { deleteDoc, getUserOrganizationId } from '@buster/database';
import type { DeleteDocResponse } from '@buster/server-shared/docs';
import { HTTPException } from 'hono/http-exception';

export async function deleteDocHandler(docId: string, user: User): Promise<DeleteDocResponse> {
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

  const doc = await deleteDoc({
    id: docId,
    organizationId: userToOrg.organizationId,
  });

  if (!doc) {
    throw new HTTPException(404, { message: 'Document not found' });
  }

  return {
    success: true,
    message: 'Document deleted successfully',
  };
}
