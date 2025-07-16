import {
  type UserOrganizationInfo,
  checkEmailDomainForOrganization,
  checkUserInOrganization,
  createUserInOrganization,
  getOrganizationWithDefaults,
} from '@buster/access-controls';
import type { User, organizations } from '@buster/database';
import { type SlackUser, SlackUserService } from '@buster/slack';
import { SlackHelpers } from './slack-helpers';

export type SlackAuthenticationResult =
  | { type: 'authorized'; user: User; organization: typeof organizations.$inferSelect }
  | { type: 'auto_provisioned'; user: User; organization: typeof organizations.$inferSelect }
  | { type: 'unauthorized'; reason: string };

/**
 * Authenticate a Slack user for an organization
 * - Fetches user email from Slack
 * - Checks if user exists in organization
 * - Auto-provisions user if domain matches and organization allows it
 * - Returns appropriate auth result
 */
export async function authenticateSlackUser(
  slackUserId: string,
  workspaceId: string
): Promise<SlackAuthenticationResult> {
  try {
    // Get Slack integration for the workspace
    const integration = await SlackHelpers.getActiveIntegrationByTeamId(workspaceId);
    if (!integration) {
      return {
        type: 'unauthorized',
        reason: 'No active Slack integration found for this workspace',
      };
    }

    // Get the access token from vault
    if (!integration.tokenVaultKey) {
      return {
        type: 'unauthorized',
        reason: 'No token vault key found for Slack integration',
      };
    }

    const accessToken = await SlackHelpers.getAccessToken(integration.tokenVaultKey);
    if (!accessToken) {
      return {
        type: 'unauthorized',
        reason: 'Failed to retrieve Slack access token',
      };
    }

    // Fetch user info from Slack
    const slackUserService = new SlackUserService();
    let userEmail: string;
    let slackUserInfo: SlackUser;

    try {
      // Fetch all Slack user data concurrently for better performance
      const [isBot, isDeleted, userInfo] = await Promise.all([
        slackUserService.isBot(accessToken, slackUserId),
        slackUserService.isDeleted(accessToken, slackUserId),
        slackUserService.getUserInfo(accessToken, slackUserId),
      ]);

      // Check if user is a bot
      if (isBot) {
        return {
          type: 'unauthorized',
          reason: 'Bot users cannot access Buster',
        };
      }

      // Check if user is deleted
      if (isDeleted) {
        return {
          type: 'unauthorized',
          reason: 'Deleted users cannot access Buster',
        };
      }

      // Extract email from user info
      if (!userInfo.profile?.email) {
        return {
          type: 'unauthorized',
          reason: 'User does not have an email address in Slack',
        };
      }

      userEmail = userInfo.profile.email;
      slackUserInfo = userInfo;
    } catch (error) {
      console.error('Failed to fetch Slack user info:', error);
      return {
        type: 'unauthorized',
        reason: 'Failed to fetch user information from Slack',
      };
    }

    // Check if user exists in the organization
    const userOrgInfo = await checkUserInOrganization(
      integration.userId,
      integration.organizationId
    );

    if (userOrgInfo) {
      // User exists - check their status
      if (userOrgInfo.status !== 'active') {
        return {
          type: 'unauthorized',
          reason: `User account is ${userOrgInfo.status}. Please contact your administrator.`,
        };
      }

      // Get full user and organization data concurrently
      const [user, organization] = await Promise.all([
        SlackHelpers.getUserById(integration.userId),
        getOrganizationWithDefaults(integration.organizationId),
      ]);

      if (!user || !organization) {
        return {
          type: 'unauthorized',
          reason: 'Failed to load user or organization data',
        };
      }

      return {
        type: 'authorized',
        user,
        organization,
      };
    }

    // User doesn't exist - check if we can auto-provision
    const organization = await getOrganizationWithDefaults(integration.organizationId);
    if (!organization) {
      return {
        type: 'unauthorized',
        reason: 'Organization not found',
      };
    }

    // Check if email domain is allowed for this organization
    const isDomainAllowed = await checkEmailDomainForOrganization(
      userEmail,
      integration.organizationId
    );

    if (!isDomainAllowed) {
      return {
        type: 'unauthorized',
        reason:
          'Your email domain is not authorized for this organization. Please contact your administrator to be added.',
      };
    }

    // Auto-provision the user
    try {
      // Use the already fetched Slack user info instead of making another API call
      const userName = slackUserInfo.real_name || slackUserInfo.name || userEmail.split('@')[0];

      const { user } = await createUserInOrganization(
        userEmail,
        userName,
        integration.organizationId,
        integration.userId // The user who installed the integration is the creator
      );

      console.info('Auto-provisioned Slack user', {
        userId: user.id,
        email: userEmail,
        organizationId: integration.organizationId,
        slackUserId,
      });

      return {
        type: 'auto_provisioned',
        user,
        organization,
      };
    } catch (error) {
      console.error('Failed to auto-provision user:', error);
      return {
        type: 'unauthorized',
        reason: 'Failed to create user account. Please contact your administrator.',
      };
    }
  } catch (error) {
    console.error('Error in authenticateSlackUser:', error);
    return {
      type: 'unauthorized',
      reason: 'An error occurred during authentication. Please try again.',
    };
  }
}

/**
 * Helper to extract user ID from authentication result
 */
export function getUserIdFromAuthResult(result: SlackAuthenticationResult): string | null {
  if (result.type === 'authorized' || result.type === 'auto_provisioned') {
    return result.user.id;
  }
  return null;
}

/**
 * Helper to check if authentication was successful
 */
export function isAuthSuccessful(result: SlackAuthenticationResult): boolean {
  return result.type === 'authorized' || result.type === 'auto_provisioned';
}
