import {
  type User,
  getActiveGithubIntegration,
  getUserOrganizationId,
} from '@buster/database/queries';
import { HTTPException } from 'hono/http-exception';

interface GetIntegrationResponse {
  connected: boolean;
  installationId?: string;
  githubOrgId?: string;
  createdAt?: string;
  status?: string;
}

/**
 * Get the current GitHub integration status for the user's organization
 * Returns non-sensitive information about the integration
 */
export async function getIntegrationHandler(user: User): Promise<GetIntegrationResponse> {
  // Get user's organization
  const userOrg = await getUserOrganizationId(user.id);
  if (!userOrg) {
    // Return disconnected status if user has no org
    return {
      connected: false,
    };
  }

  try {
    // Get active GitHub integration for the organization
    const integration = await getActiveGithubIntegration(userOrg.organizationId);

    if (!integration) {
      return {
        connected: false,
      };
    }

    // Return non-sensitive integration data
    return {
      connected: true,
      installationId: integration.installationId,
      githubOrgId: integration.githubOrgId,
      createdAt: integration.createdAt,
      status: integration.status,
    };
  } catch (error) {
    console.error('Failed to get GitHub integration:', error);

    // Return disconnected on error rather than throwing
    return {
      connected: false,
    };
  }
}
