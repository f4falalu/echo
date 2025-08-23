import { randomUUID } from 'node:crypto';
import {
  createGithubIntegration,
  createSecret,
  db,
  deleteSecret,
  getSecretByName,
  githubIntegrations,
  organizations,
  updateGithubIntegration,
  users,
} from '@buster/database';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  generateTestId,
  getTestGitHubOrgId,
  getTestInstallationId,
  rateLimitDelay,
  skipIfNoGitHubCredentials,
} from '../../../../apps/server/src/api/v2/github/test-helpers/github-test-setup';
import { createGitHubApp } from '../client/app';
import {
  deleteInstallationToken,
  generateTokenVaultKey,
  getInstallationToken,
  getInstallationTokenByOrgId,
  isTokenExpired,
  retrieveInstallationToken,
  storeInstallationToken,
  verifyInstallationOwnership,
} from './token';

describe('GitHub Token Service Integration Tests', () => {
  const testIds: string[] = [];
  const secretIds: string[] = [];
  let testOrgId: string;
  let testUserId: string;
  let testIntegrationId: string;

  beforeEach(async () => {
    if (skipIfNoGitHubCredentials()) {
      return;
    }

    // Create test organization
    const [org] = await db
      .insert(organizations)
      .values({
        id: randomUUID(),
        name: generateTestId('test-org'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();
    testOrgId = org.id;
    testIds.push(org.id);

    // Create test user
    const [user] = await db
      .insert(users)
      .values({
        id: randomUUID(),
        email: `${generateTestId('test')}@example.com`,
        name: 'Test User',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();
    testUserId = user.id;
    testIds.push(user.id);
  });

  afterEach(async () => {
    // Clean up secrets
    for (const secretId of secretIds) {
      try {
        await deleteSecret(secretId);
      } catch (error) {
        // Ignore deletion errors
      }
    }
    secretIds.length = 0;

    // Clean up test integrations
    if (testIntegrationId) {
      await db.delete(githubIntegrations).where(eq(githubIntegrations.id, testIntegrationId));
    }

    // Clean up test data
    for (const id of testIds) {
      try {
        await db.delete(organizations).where(eq(organizations.id, id));
        await db.delete(users).where(eq(users.id, id));
      } catch (error) {
        // Ignore deletion errors
      }
    }
    testIds.length = 0;
  });

  describe('Token Storage and Retrieval', () => {
    it('should store and retrieve an installation token', async () => {
      if (skipIfNoGitHubCredentials()) {
        return;
      }

      const installationId = generateTestId('install');
      const testToken = `ghs_${generateTestId('token')}`;
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour from now
      const permissions = { contents: 'read', pull_requests: 'write' };

      // Store token
      const vaultKey = await storeInstallationToken(
        installationId,
        testToken,
        expiresAt,
        permissions,
        'all'
      );

      expect(vaultKey).toBeTruthy();

      // Track for cleanup
      const secret = await getSecretByName(generateTokenVaultKey(installationId));
      if (secret) secretIds.push(secret.id);

      // Retrieve token
      const retrieved = await retrieveInstallationToken(installationId);

      expect(retrieved).toBeTruthy();
      expect(retrieved?.token).toBe(testToken);
      expect(retrieved?.metadata.expiresAt).toBe(expiresAt);
      expect(retrieved?.metadata.permissions).toEqual(permissions);
      expect(retrieved?.metadata.repositorySelection).toBe('all');
    });

    it('should update existing token when storing again', async () => {
      if (skipIfNoGitHubCredentials()) {
        return;
      }

      const installationId = generateTestId('install');
      const firstToken = `ghs_${generateTestId('first')}`;
      const secondToken = `ghs_${generateTestId('second')}`;
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      // Store first token
      await storeInstallationToken(installationId, firstToken, expiresAt);

      // Track for cleanup
      const secret = await getSecretByName(generateTokenVaultKey(installationId));
      if (secret) secretIds.push(secret.id);

      // Store second token (should update)
      await storeInstallationToken(installationId, secondToken, expiresAt);

      // Retrieve and verify it's the second token
      const retrieved = await retrieveInstallationToken(installationId);
      expect(retrieved?.token).toBe(secondToken);
    });

    it('should delete installation token', async () => {
      if (skipIfNoGitHubCredentials()) {
        return;
      }

      const installationId = generateTestId('install');
      const testToken = `ghs_${generateTestId('token')}`;
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      // Store token
      await storeInstallationToken(installationId, testToken, expiresAt);

      // Delete token
      await deleteInstallationToken(installationId);

      // Verify it's deleted
      const retrieved = await retrieveInstallationToken(installationId);
      expect(retrieved).toBeNull();
    });
  });

  describe('Token Expiration', () => {
    it('should correctly identify expired tokens', () => {
      // Token expired 10 minutes ago
      const expiredDate = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      expect(isTokenExpired(expiredDate)).toBe(true);

      // Token expires in 10 minutes (should not be expired)
      const futureDate = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      expect(isTokenExpired(futureDate)).toBe(false);

      // Token expires in 3 minutes (should be considered expired due to 5-minute buffer)
      const nearExpiry = new Date(Date.now() + 3 * 60 * 1000).toISOString();
      expect(isTokenExpired(nearExpiry)).toBe(true);
    });
  });

  describe('Real GitHub API Token Generation', () => {
    it('should generate a real installation token and make API call', async () => {
      // Skip if no credentials or installation ID
      if (skipIfNoGitHubCredentials()) {
        return;
      }

      const testInstallationId = getTestInstallationId();
      if (!testInstallationId) {
        console.info('Skipping - TEST_GITHUB_INSTALLATION_ID not set');
        return;
      }

      // Create integration record
      const integration = await createGithubIntegration({
        organizationId: testOrgId,
        userId: testUserId,
        installationId: testInstallationId,
        githubOrgId: getTestGitHubOrgId(),
        status: 'active',
      });
      testIntegrationId = integration.id;

      // Generate real token
      const tokenResponse = await getInstallationToken(testInstallationId);

      expect(tokenResponse).toBeTruthy();
      expect(tokenResponse.token).toMatch(/^ghs_/);
      expect(tokenResponse.expires_at).toBeTruthy();
      expect(new Date(tokenResponse.expires_at).getTime()).toBeGreaterThan(Date.now());

      // Clean up token from vault
      await deleteInstallationToken(testInstallationId);

      // Add rate limit delay
      await rateLimitDelay();
    });

    it('should cache tokens and reuse when not expired', async () => {
      if (skipIfNoGitHubCredentials()) {
        return;
      }

      const testInstallationId = getTestInstallationId();
      if (!testInstallationId) {
        console.info('Skipping - TEST_GITHUB_INSTALLATION_ID not set');
        return;
      }

      // Create integration record
      const integration = await createGithubIntegration({
        organizationId: testOrgId,
        userId: testUserId,
        installationId: testInstallationId,
        githubOrgId: getTestGitHubOrgId(),
        status: 'active',
      });
      testIntegrationId = integration.id;

      // First call - generates new token
      const firstCall = await getInstallationToken(testInstallationId);
      expect(firstCall.token).toMatch(/^ghs_/);

      // Second call - should return cached token
      const secondCall = await getInstallationToken(testInstallationId);
      expect(secondCall.token).toBe(firstCall.token);
      expect(secondCall.expires_at).toBe(firstCall.expires_at);

      // Clean up
      await deleteInstallationToken(testInstallationId);
      await rateLimitDelay();
    });

    it('should handle suspended installations', async () => {
      if (skipIfNoGitHubCredentials()) {
        return;
      }

      const testInstallationId = generateTestId('suspended');

      // Create suspended integration
      const integration = await createGithubIntegration({
        organizationId: testOrgId,
        userId: testUserId,
        installationId: testInstallationId,
        githubOrgId: getTestGitHubOrgId(),
        status: 'suspended',
      });
      testIntegrationId = integration.id;

      // Should throw error for suspended installation
      await expect(getInstallationToken(testInstallationId)).rejects.toThrow(
        /Installation .* is suspended/
      );
    });

    it('should handle revoked installations', async () => {
      if (skipIfNoGitHubCredentials()) {
        return;
      }

      const testInstallationId = generateTestId('revoked');

      // Create revoked integration
      const integration = await createGithubIntegration({
        organizationId: testOrgId,
        userId: testUserId,
        installationId: testInstallationId,
        githubOrgId: getTestGitHubOrgId(),
        status: 'revoked',
      });
      testIntegrationId = integration.id;

      // Should throw error for revoked installation
      await expect(getInstallationToken(testInstallationId)).rejects.toThrow(
        /Installation .* has been revoked/
      );
    });
  });

  describe('Organization Token Retrieval', () => {
    it('should get token by organization ID', async () => {
      if (skipIfNoGitHubCredentials()) {
        return;
      }

      const testInstallationId = getTestInstallationId();
      if (!testInstallationId) {
        console.info('Skipping - TEST_GITHUB_INSTALLATION_ID not set');
        return;
      }

      // Create active integration
      const integration = await createGithubIntegration({
        organizationId: testOrgId,
        userId: testUserId,
        installationId: testInstallationId,
        githubOrgId: getTestGitHubOrgId(),
        status: 'active',
      });
      testIntegrationId = integration.id;

      // Get token by org ID
      const tokenResponse = await getInstallationTokenByOrgId(testOrgId);

      expect(tokenResponse).toBeTruthy();
      expect(tokenResponse.token).toMatch(/^ghs_/);

      // Clean up
      await deleteInstallationToken(testInstallationId);
      await rateLimitDelay();
    });

    it('should throw error when no active integration for org', async () => {
      if (skipIfNoGitHubCredentials()) {
        return;
      }

      const nonExistentOrgId = randomUUID();

      await expect(getInstallationTokenByOrgId(nonExistentOrgId)).rejects.toThrow(
        /No active GitHub integration found/
      );
    });
  });

  describe('Installation Ownership Verification', () => {
    it('should verify installation ownership correctly', async () => {
      if (skipIfNoGitHubCredentials()) {
        return;
      }

      const testInstallationId = generateTestId('ownership');

      // Create integration
      const integration = await createGithubIntegration({
        organizationId: testOrgId,
        userId: testUserId,
        installationId: testInstallationId,
        githubOrgId: getTestGitHubOrgId(),
        status: 'active',
      });
      testIntegrationId = integration.id;

      // Should return true for correct org
      const isOwner = await verifyInstallationOwnership(testInstallationId, testOrgId);
      expect(isOwner).toBe(true);

      // Should return false for different org
      const wrongOrgId = randomUUID();
      const isNotOwner = await verifyInstallationOwnership(testInstallationId, wrongOrgId);
      expect(isNotOwner).toBe(false);
    });

    it('should return false for non-existent installation', async () => {
      if (skipIfNoGitHubCredentials()) {
        return;
      }

      const nonExistentInstallation = generateTestId('nonexistent');
      const isOwner = await verifyInstallationOwnership(nonExistentInstallation, testOrgId);
      expect(isOwner).toBe(false);
    });
  });
});
