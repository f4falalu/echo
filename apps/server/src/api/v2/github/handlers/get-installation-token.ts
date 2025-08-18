import { type User, getUserOrganizationId } from '@buster/database';
import type { InstallationTokenResponse } from '@buster/server-shared/github';
import { GitHubErrorCode } from '@buster/server-shared/github';
import { HTTPException } from 'hono/http-exception';
import {
  getInstallationToken,
  verifyInstallationOwnership,
} from '../services/get-installation-token';

/**
 * Get an installation token for a specific installation
 * Verifies that the installation belongs to the user's organization
 */
export async function getInstallationTokenHandler(
  installationId: string,
  user: User
): Promise<InstallationTokenResponse> {
  console.info(`Getting installation token for ${installationId} requested by user ${user.id}`);

  // Get user's organization
  const userOrg = await getUserOrganizationId(user.id);
  if (!userOrg) {
    throw new HTTPException(400, {
      message: 'User is not associated with an organization',
    });
  }

  // Verify the user has access to this installation
  const hasAccess = await verifyInstallationOwnership(installationId, userOrg.organizationId);

  if (!hasAccess) {
    console.warn(
      `User ${user.id} attempted to access installation ${installationId} without permission`
    );
    throw new HTTPException(403, {
      message: 'You do not have access to this installation',
    });
  }

  try {
    // Get or generate the token
    const tokenResponse = await getInstallationToken(installationId);

    console.info(`Successfully retrieved token for installation ${installationId}`);

    return tokenResponse;
  } catch (error) {
    console.error(`Failed to get token for installation ${installationId}:`, error);

    if (error instanceof Error && 'code' in error) {
      const githubError = error as Error & { code: GitHubErrorCode };

      // Map error codes to HTTP status codes
      const statusMap: Record<GitHubErrorCode, number> = {
        [GitHubErrorCode.INSTALLATION_NOT_FOUND]: 404,
        [GitHubErrorCode.INSTALLATION_SUSPENDED]: 403,
        [GitHubErrorCode.INSTALLATION_REVOKED]: 403,
        [GitHubErrorCode.TOKEN_GENERATION_FAILED]: 500,
        [GitHubErrorCode.TOKEN_STORAGE_FAILED]: 500,
        [GitHubErrorCode.APP_CONFIGURATION_ERROR]: 500,
        [GitHubErrorCode.DATABASE_ERROR]: 500,
      } as Record<GitHubErrorCode, number>;

      const status = statusMap[githubError.code] || 500;

      // biome-ignore lint/suspicious/noExplicitAny: HTTPException has complex status type
      throw new HTTPException(status as any, {
        message: githubError.message,
      });
    }

    throw new HTTPException(500, {
      message: 'Failed to retrieve installation token',
    });
  }
}
