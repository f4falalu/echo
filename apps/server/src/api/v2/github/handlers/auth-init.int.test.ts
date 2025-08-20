import { randomUUID } from 'node:crypto';
import {
  createGithubIntegration,
  db,
  deleteSecret,
  getSecretByName,
  githubIntegrations,
  organizations,
  users,
  usersToOrganizations,
} from '@buster/database';
import type { User } from '@buster/database';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { generateTestId, skipIfNoGitHubCredentials } from '../test-helpers/github-test-setup';
import { authInitHandler } from './auth-init';

describe('Auth Init Handler Integration Tests', () => {
  const testIds: string[] = [];
  const secretNames: string[] = [];
  let testOrgId: string;
  let testUser: User;

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
    if (!org) throw new Error('Failed to create test organization');
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
    if (!user) throw new Error('Failed to create test user');
    testUser = user;
    testIds.push(user.id);

    // Create user organization grant
    const [grant] = await db
      .insert(usersToOrganizations)
      .values({
        userId: testUser.id,
        organizationId: testOrgId,
        role: 'workspace_admin',
        createdBy: testUser.id,
        updatedBy: testUser.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();
  });

  afterEach(async () => {
    // Clean up secrets
    for (const secretName of secretNames) {
      try {
        const secret = await getSecretByName(secretName);
        if (secret) {
          // Use deleteSecret function instead of direct db access
          await deleteSecret(secret.id);
        }
      } catch (error) {
        // Ignore deletion errors
      }
    }
    secretNames.length = 0;

    // Clean up test integrations
    await db.delete(githubIntegrations).where(eq(githubIntegrations.organizationId, testOrgId));

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

  describe('OAuth Initiation', () => {
    it('should initiate OAuth flow and create state', async () => {
      if (skipIfNoGitHubCredentials()) {
        return;
      }

      const result = await authInitHandler(testUser);

      // Should return installation URL with state
      expect(result.redirectUrl).toContain('https://github.com/apps/');
      expect(result.redirectUrl).toContain('/installations/new');
      expect(result.redirectUrl).toContain('state=');

      // Extract state from URL
      const url = new URL(result.redirectUrl);
      const state = url.searchParams.get('state');
      expect(state).toBeTruthy();

      // Track for cleanup
      if (state) {
        secretNames.push(`github_oauth_state_${state}`);
      }

      // Verify state was stored in vault
      const storedState = await getSecretByName(`github_oauth_state_${state}`);
      expect(storedState).toBeTruthy();
      expect(storedState?.description).toContain(testOrgId);
      expect(storedState?.description).toContain(testUser.id);
    });

    it('should use GITHUB_APP_NAME from environment', async () => {
      if (skipIfNoGitHubCredentials()) {
        return;
      }

      const result = await authInitHandler(testUser);

      const appName = process.env.GITHUB_APP_NAME;
      if (appName) {
        expect(result.redirectUrl).toContain(`/apps/${appName}/installations/new`);
      }
    });

    it('should prevent duplicate active integrations', async () => {
      if (skipIfNoGitHubCredentials()) {
        return;
      }

      // Create an existing active integration
      await createGithubIntegration({
        organizationId: testOrgId,
        userId: testUser.id,
        installationId: generateTestId('existing'),
        githubOrgId: generateTestId('github-org'),
        status: 'active',
      });

      // Should throw error when trying to initiate another
      await expect(authInitHandler(testUser)).rejects.toThrow(
        /already has an active GitHub integration/
      );
    });

    it('should allow initiation when existing integration is revoked', async () => {
      if (skipIfNoGitHubCredentials()) {
        return;
      }

      // Create a revoked integration
      await createGithubIntegration({
        organizationId: testOrgId,
        userId: testUser.id,
        installationId: generateTestId('revoked'),
        githubOrgId: generateTestId('github-org'),
        status: 'revoked',
      });

      // Should allow new initiation
      const result = await authInitHandler(testUser);
      expect(result.redirectUrl).toContain('https://github.com/apps/');

      // Extract and track state for cleanup
      const url = new URL(result.redirectUrl);
      const state = url.searchParams.get('state');
      if (state) {
        secretNames.push(`github_oauth_state_${state}`);
      }
    });

    it('should generate unique states for each initiation', async () => {
      if (skipIfNoGitHubCredentials()) {
        return;
      }

      // Create another test user and org
      const [org2] = await db
        .insert(organizations)
        .values({
          id: randomUUID(),
          name: generateTestId('test-org2'),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returning();
      if (!org2) throw new Error('Failed to create test org2');
      testIds.push(org2.id);

      const [user2] = await db
        .insert(users)
        .values({
          id: randomUUID(),
          email: `${generateTestId('test2')}@example.com`,
          name: 'Test User 2',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returning();
      if (!user2) throw new Error('Failed to create test user2');
      testIds.push(user2.id);

      // Create grant for user2
      const [grant2] = await db
        .insert(usersToOrganizations)
        .values({
          userId: user2.id,
          organizationId: org2.id,
          role: 'workspace_admin',
          createdBy: user2.id,
          updatedBy: user2.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returning();

      // Initiate for both users
      const result1 = await authInitHandler(testUser);
      const result2 = await authInitHandler(user2);

      // Extract states
      const url1 = new URL(result1.redirectUrl);
      const url2 = new URL(result2.redirectUrl);
      const state1 = url1.searchParams.get('state');
      const state2 = url2.searchParams.get('state');

      // States should be different
      expect(state1).not.toBe(state2);

      // Track for cleanup
      if (state1) secretNames.push(`github_oauth_state_${state1}`);
      if (state2) secretNames.push(`github_oauth_state_${state2}`);
    });

    it('should include proper state expiration in metadata', async () => {
      if (skipIfNoGitHubCredentials()) {
        return;
      }

      const result = await authInitHandler(testUser);

      // Extract state
      const url = new URL(result.redirectUrl);
      const state = url.searchParams.get('state');
      expect(state).toBeTruthy();

      // Track for cleanup
      if (state) {
        secretNames.push(`github_oauth_state_${state}`);
      }

      // Check stored state metadata
      const storedState = await getSecretByName(`github_oauth_state_${state}`);
      expect(storedState).toBeTruthy();

      if (storedState?.description) {
        const metadata = JSON.parse(storedState.description);
        expect(metadata.expiresAt).toBeTruthy();

        // Should expire in 10 minutes
        const expiresAt = new Date(metadata.expiresAt);
        const now = new Date();
        const diffMinutes = (expiresAt.getTime() - now.getTime()) / (1000 * 60);
        expect(diffMinutes).toBeGreaterThan(9);
        expect(diffMinutes).toBeLessThan(11);
      }
    });
  });
});
