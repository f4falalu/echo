import type { User } from '@buster/database/queries';
import { getUserOrganizationId, listDocs } from '@buster/database/queries';
import type { GetDocsListRequest, GetDocsListResponse } from '@buster/server-shared/docs';
import { HTTPException } from 'hono/http-exception';

export async function listDocsHandler(
  request: GetDocsListRequest,
  user: User
): Promise<GetDocsListResponse> {
  const { page, page_size, type, search } = request;

  const userToOrg = await getUserOrganizationId(user.id);

  if (!userToOrg) {
    throw new HTTPException(403, {
      message: 'User is not associated with an organization',
    });
  }

  const result = await listDocs({
    organizationId: userToOrg.organizationId,
    type: type as 'analyst' | 'normal' | undefined,
    search,
    page,
    pageSize: page_size,
  });

  return {
    data: result.data.map((doc) => ({
      id: doc.id,
      name: doc.name,
      content: doc.content,
      type: doc.type as 'analyst' | 'normal',
      organizationId: doc.organizationId,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      deletedAt: doc.deletedAt,
    })),
    total: result.total,
    page: result.page,
    page_size: result.pageSize,
    total_pages: result.totalPages,
  };
}
