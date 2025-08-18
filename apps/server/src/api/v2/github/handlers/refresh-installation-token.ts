import { type User, getUserOrganizationId } from '@buster/database';
import type { InstallationTokenResponse } from '@buster/server-shared/github';
import { GitHubErrorCode } from '@buster/server-shared/github';
import { HTTPException } from 'hono/http-exception';
import { getInstallationTokenByOrgId } from '../services/get-installation-token';

/**
 * Refresh the installation token for the user's organization
 * Looks up the active GitHub integration and returns a fresh token
 */
export async function refreshInstallationTokenHandler(
  user: User
): Promise<InstallationTokenResponse> {
  // Get user's organization
  const userOrg = await getUserOrganizationId(user.id);
  if (!userOrg) {
    throw new HTTPException(400, {
      message: 'User is not associated with an organization',
    });
  }

  console.info(`Refreshing installation token for organization ${userOrg.organizationId}`);

  try {
    // Get token for the user's organization
    const tokenResponse = await getInstallationTokenByOrgId(userOrg.organizationId);

    console.info(`Successfully refreshed token for organization ${userOrg.organizationId}`);

    return tokenResponse;
  } catch (error) {
    console.error(`Failed to refresh token for organization ${userOrg.organizationId}:`, error);

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
      message: 'Failed to refresh installation token',
    });
  }
}
