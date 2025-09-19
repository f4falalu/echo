import { randomBytes } from 'node:crypto';
import { type User, getUserOrganizationId } from '@buster/database/queries';
import { HTTPException } from 'hono/http-exception';
import { storeInstallationState } from '../services/installation-state';

/**
 * Initiates the GitHub App installation flow
 * Redirects the user to GitHub to install the app with a state parameter
 */
export async function authInitHandler(user: User): Promise<{ redirectUrl: string }> {
  // Get user's organization
  const userOrg = await getUserOrganizationId(user.id);
  if (!userOrg) {
    throw new HTTPException(400, {
      message: 'User is not associated with an organization',
    });
  }

  // Generate a secure state parameter
  const state = randomBytes(32).toString('hex');

  // Store the state with user/org context (expires in 10 minutes)
  await storeInstallationState(state, {
    userId: user.id,
    organizationId: userOrg.organizationId,
    createdAt: new Date().toISOString(),
  });

  // Get GitHub App ID from environment
  const appId = process.env.GITHUB_APP_ID;
  if (!appId) {
    throw new HTTPException(500, {
      message: 'GitHub App not configured',
    });
  }

  // Build the GitHub installation URL
  const appName = process.env.GITHUB_APP_NAME;
  if (!appName) {
    throw new HTTPException(500, {
      message: 'GitHub App name not configured',
    });
  }

  // GitHub will redirect to the Setup URL or Callback URL configured in the app settings
  // We pass the state as a parameter that GitHub will preserve
  const redirectUrl = `https://github.com/apps/${appName}/installations/new?state=${state}`;

  console.info(`Initiating GitHub installation for user ${user.id}, org ${userOrg.organizationId}`);

  return { redirectUrl };
}
