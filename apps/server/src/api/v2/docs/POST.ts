import type { User } from '@buster/database';
import { getUserOrganizationId, upsertDoc } from '@buster/database';
import type { CreateDocRequest, CreateDocResponse } from '@buster/server-shared/docs';
import { HTTPException } from 'hono/http-exception';

export async function createDocHandler(
  request: CreateDocRequest,
  user: User
): Promise<CreateDocResponse> {
  try {
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

    const doc = await upsertDoc({
      name,
      content,
      type,
      organizationId: userToOrg.organizationId,
    });

    if (!doc) {
      throw new HTTPException(400, {
        message: 'Failed to create doc',
      });
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
  } catch (error) {
    console.error('Error creating doc:', error);

    // Re-throw HTTPExceptions as-is
    if (error instanceof HTTPException) {
      throw error;
    }

    // Handle other errors as 500
    throw new HTTPException(500, {
      message: 'Failed to create doc',
    });
  }
}
