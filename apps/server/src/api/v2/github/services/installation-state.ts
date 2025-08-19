import { createSecret, deleteSecret, getSecretByName, updateSecret } from '@buster/database';

interface InstallationState {
  userId: string;
  organizationId: string;
  createdAt: string;
}

/**
 * Generate a vault key for OAuth state
 */
function generateStateVaultKey(state: string): string {
  return `github_oauth_state_${state}`;
}

/**
 * Store installation state for OAuth flow
 * State expires after 10 minutes
 */
export async function storeInstallationState(
  state: string,
  data: InstallationState
): Promise<void> {
  const key = generateStateVaultKey(state);

  try {
    // Check if state already exists (shouldn't happen with random generation)
    const existing = await getSecretByName(key);

    if (existing) {
      await updateSecret({
        id: existing.id,
        secret: JSON.stringify(data),
        name: key,
        description: `GitHub OAuth state expires at ${new Date(Date.now() + 10 * 60 * 1000).toISOString()}`,
      });
    } else {
      await createSecret({
        secret: JSON.stringify(data),
        name: key,
        description: `GitHub OAuth state expires at ${new Date(Date.now() + 10 * 60 * 1000).toISOString()}`,
      });
    }

    console.info(`Stored OAuth state for user ${data.userId}, org ${data.organizationId}`);
  } catch (error) {
    console.error('Failed to store OAuth state:', error);
    throw new Error('Failed to store installation state');
  }
}

/**
 * Retrieve and validate installation state
 * Returns null if state doesn't exist or is expired
 */
export async function retrieveInstallationState(state: string): Promise<InstallationState | null> {
  const key = generateStateVaultKey(state);

  try {
    const secret = await getSecretByName(key);

    if (!secret) {
      console.warn(`OAuth state not found: ${state}`);
      return null;
    }

    // Check if state is expired (10 minutes)
    const data = JSON.parse(secret.secret) as InstallationState;
    const createdAt = new Date(data.createdAt);
    const now = new Date();
    const tenMinutes = 10 * 60 * 1000;

    if (now.getTime() - createdAt.getTime() > tenMinutes) {
      console.warn(`OAuth state expired: ${state}`);
      // Clean up expired state
      await deleteSecret(secret.id);
      return null;
    }

    // Delete state after retrieval (one-time use)
    await deleteSecret(secret.id);

    console.info(`Retrieved OAuth state for user ${data.userId}, org ${data.organizationId}`);
    return data;
  } catch (error) {
    console.error('Failed to retrieve OAuth state:', error);
    return null;
  }
}

/**
 * Clean up expired OAuth states
 * This should be called periodically to clean up old states
 */
export async function cleanupExpiredStates(): Promise<void> {
  // This would need to be implemented with a query that finds all github_oauth_state_* secrets
  // and checks their description for expiry time
  // For now, states are cleaned up on retrieval if expired
  console.info('Cleanup of expired OAuth states would happen here');
}
