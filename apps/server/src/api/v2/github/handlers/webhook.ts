import type { githubIntegrations } from '@buster/database';
import { GitHubErrorCode, type InstallationCallbackRequest } from '@buster/github';
import type { InferSelectModel } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { handleInstallationCallback } from '../services/handle-installation-callback';

type GitHubIntegration = InferSelectModel<typeof githubIntegrations>;

/**
 * Handle GitHub App installation webhook callback
 * This is called by GitHub when the app is installed, uninstalled, or suspended
 */
export async function webhookHandler(
  payload: InstallationCallbackRequest,
  organizationId?: string,
  userId?: string
): Promise<{ success: boolean; integration?: GitHubIntegration; message: string }> {
  console.info(`Processing GitHub installation callback: action=${payload.action}`);

  // For deleted/suspended/unsuspended actions, we can look up existing integration
  if (payload.action !== 'created') {
    try {
      const result = await handleInstallationCallback({
        payload,
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

  // For 'created' action, we should have org and user context from OAuth flow
  if (!organizationId || !userId) {
    // This should only happen if someone installs directly from GitHub
    // without going through our OAuth flow
    throw new HTTPException(400, {
      message:
        'Installation must be initiated from within the application. Please use the GitHub integration page to install the app.',
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
