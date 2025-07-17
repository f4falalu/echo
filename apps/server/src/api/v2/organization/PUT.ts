import { getOrganization, getUserOrganizationId, updateOrganization } from '@buster/database';
import type { User } from '@buster/database';
import type {
  UpdateOrganizationRequest,
  UpdateOrganizationResponse,
} from '@buster/server-shared/organization';
import { UpdateOrganizationRequestSchema } from '@buster/server-shared/organization';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { requireOrganizationAdmin } from '../../../middleware/auth';

/**
 * Updates organization settings
 * Currently supports updating organization color palettes
 */
export async function updateOrganizationHandler(
  organizationId: string,
  request: UpdateOrganizationRequest,
  user: User
): Promise<UpdateOrganizationResponse> {
  try {
    // Update the organization

    await updateOrganization({
      organizationId,
      ...request,
    });

    // Fetch the updated organization data
    const updatedOrg = await getOrganization({
      organizationId,
    });

    return updatedOrg;
  } catch (error) {
    console.error('Error in updateOrganizationHandler:', {
      organizationId,
      userId: user.id,
      requestFields: Object.keys(request),
      error: error instanceof Error ? error.message : error,
    });

    throw new HTTPException(500, {
      message: 'Failed to update organization',
    });
  }
}

// Create route module for the update endpoint
const app = new Hono().put(
  '/',
  requireOrganizationAdmin,
  zValidator('json', UpdateOrganizationRequestSchema),
  async (c) => {
    const request = c.req.valid('json');
    const user = c.get('busterUser');
    const userOrg = c.get('userOrganizationInfo');

    const organizationId = userOrg.organizationId;
    //const role = userOrg.role;

    // if (!canEditOrganization(role)) {
    //   throw new HTTPException(403, {
    //     message: 'User does not have permission to edit organization',
    //   });
    // }

    const response: UpdateOrganizationResponse = await updateOrganizationHandler(
      organizationId,
      request,
      user
    );

    return c.json(response);
  }
);

export default app;
