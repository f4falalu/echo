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
import { z } from 'zod';
import { requireOrganizationAdmin } from '../../../middleware/auth';

/**
 * Updates organization settings
 * Currently supports updating organization color palettes
 */
async function updateOrganizationHandler(
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

    // Re-throw Zod errors to be handled by the route error handler
    if (error instanceof z.ZodError) {
      throw error;
    }

    throw new HTTPException(500, {
      message: 'Failed to update organization',
    });
  }
}

// Create route module for the update endpoint
const app = new Hono()
  .use('*', requireOrganizationAdmin)
  .put('/', zValidator('json', UpdateOrganizationRequestSchema), async (c) => {
    const request = c.req.valid('json');
    const user = c.get('busterUser');
    const userOrg = c.get('userOrganizationInfo');

    const organizationId = userOrg.organizationId;

    const response: UpdateOrganizationResponse = await updateOrganizationHandler(
      organizationId,
      request,
      user
    );

    return c.json(response);
  })
  .onError((e, c) => {
    // Handle Zod validation errors with detailed information
    if (e instanceof z.ZodError) {
      return c.json(
        {
          error: 'Validation Error',
          message: 'Invalid request data',
          issues: e.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
            code: issue.code,
          })),
        },
        400
      );
    }

    // Handle HTTP exceptions
    if (e instanceof HTTPException) {
      return e.getResponse();
    }

    // Log unexpected errors
    console.error('Unhandled error in organization PUT:', e);

    // Return generic error for unexpected issues
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to update organization',
      },
      500
    );
  });

export default app;
