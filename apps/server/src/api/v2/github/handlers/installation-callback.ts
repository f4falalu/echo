import type { githubIntegrations } from '@buster/database';
import type { InferSelectModel } from 'drizzle-orm';

type GitHubIntegration = InferSelectModel<typeof githubIntegrations>;
import type { InstallationCallbackRequest } from '@buster/server-shared/github';
import { GitHubErrorCode } from '@buster/server-shared/github';
import { HTTPException } from 'hono/http-exception';
import { handleInstallationCallback } from '../services/handle-installation-callback';

/**
 * Handle GitHub App installation webhook callback
 * This is called by GitHub when the app is installed, uninstalled, or suspended
 */
export async function installationCallbackHandler(
  payload: InstallationCallbackRequest,
  organizationId?: string,
  userId?: string
): Promise<{ success: boolean; integration?: GitHubIntegration; message: string }> {
  console.info(`Processing GitHub installation callback: action=${payload.action}`);

  // For webhook events, we need to determine the org/user context
  // This is a challenge since webhooks don't have auth context
  // Options:
  // 1. Store a mapping of GitHub org ID to our org ID
  // 2. Include org ID in the webhook URL
  // 3. Look up by installation ID if it already exists

  // For deleted/suspended/unsuspended actions, we can look up existing integration
  if (payload.action !== 'created') {
    try {
      const result = await handleInstallationCallback({
        payload,
        // These will be empty for non-created actions, but the service handles that
        organizationId: organizationId || '',
        userId: userId || '',
      });

      return {
        success: true,
        integration: result,
        message: `Installation ${payload.action} successfully`,
      };
    } catch (error) {
      console.error('Failed to handle installation callback:', error);

      if (error instanceof Error && 'code' in error) {
        const githubError = error as Error & { code: GitHubErrorCode };

        // Map error codes to HTTP status codes
        const statusMap: Record<GitHubErrorCode, number> = {
          [GitHubErrorCode.INSTALLATION_NOT_FOUND]: 404,
          [GitHubErrorCode.DATABASE_ERROR]: 500,
          [GitHubErrorCode.TOKEN_GENERATION_FAILED]: 500,
          [GitHubErrorCode.WEBHOOK_PROCESSING_FAILED]: 400,
          // Add other mappings as needed
        } as Record<GitHubErrorCode, number>;

        const status = statusMap[githubError.code] || 500;
        // biome-ignore lint/suspicious/noExplicitAny: HTTPException has complex status type
        throw new HTTPException(status as any, {
          message: githubError.message,
        });
      }

      throw new HTTPException(500, {
        message: 'Failed to process installation callback',
      });
    }
  }

  // For 'created' action, we need org and user context
  if (!organizationId || !userId) {
    // In a real implementation, you might:
    // 1. Store installation in a pending state
    // 2. Require user to complete OAuth flow to claim it
    // 3. Or extract from a state parameter in the installation URL

    console.warn('Installation created without organization context');
    throw new HTTPException(400, {
      message: 'Organization context required for new installations',
    });
  }

  try {
    const result = await handleInstallationCallback({
      payload,
      organizationId,
      userId,
    });

    return {
      success: true,
      integration: result,
      message: 'Installation created successfully',
    };
  } catch (error) {
    console.error('Failed to create installation:', error);

    if (error instanceof Error && 'code' in error) {
      const githubError = error as Error & { code: GitHubErrorCode };
      throw new HTTPException(500, {
        message: githubError.message,
      });
    }

    throw new HTTPException(500, {
      message: 'Failed to create installation',
    });
  }
}
