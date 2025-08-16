/**
 * GitHub Services
 *
 * This module exports all GitHub-related service functions
 * for handling GitHub App installations and tokens
 */

// GitHub App configuration and creation
export {
  createGitHubApp,
  getGitHubAppCredentials,
} from './github-app';

// Installation webhook handling
export { handleInstallationCallback } from './handle-installation-callback';

// Token generation and retrieval
export {
  getInstallationToken,
  getInstallationTokenByOrgId,
  verifyInstallationOwnership,
} from './get-installation-token';

// Token storage in Vault
export {
  deleteInstallationToken,
  generateTokenVaultKey,
  isTokenExpired,
  retrieveInstallationToken,
  storeInstallationToken,
} from './token-storage';

// Webhook signature verification
export {
  extractGitHubWebhookSignature,
  verifyGitHubWebhook,
  verifyGitHubWebhookSignature,
} from './verify-webhook-signature';
