import type { User } from '@buster/database';
import {
  getS3IntegrationByOrganizationId,
  getUserOrganizationId,
} from '@buster/database';
import type { GetS3IntegrationResponse } from '@buster/server-shared';
import { HTTPException } from 'hono/http-exception';

/**
 * Handler for getting the current S3 integration for an organization
 * 
 * This handler:
 * 1. Validates user has access to an organization
 * 2. Retrieves the active integration for the organization
 * 3. Returns null if no active integration exists
 */
export async function getS3IntegrationHandler(
  user: User
): Promise<GetS3IntegrationResponse> {
  // Get user's organization
  const userOrg = await getUserOrganizationId(user.id);

  if (!userOrg) {
    throw new HTTPException(403, {
      message: 'You must be part of an organization to view storage integrations',
    });
  }

  const { organizationId } = userOrg;

  try {
    // Get the active integration for the organization
    const integration = await getS3IntegrationByOrganizationId(organizationId);

    // Return null if no integration exists
    if (!integration) {
      return null;
    }

    return {
      id: integration.id,
      provider: integration.provider,
      organizationId: integration.organizationId,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
      deletedAt: integration.deletedAt,
    };
  } catch (error) {
    console.error('Error getting S3 integration:', error);
    throw new HTTPException(500, {
      message: 'Failed to retrieve storage integration',
    });
  }
}