import {
  db,
  organizations,
  slackIntegrations,
  users,
  usersToOrganizations,
} from '@buster/database';
import { and, eq, isNull } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import * as slackHelpers from './slack-helpers';
import { tokenStorage } from './token-storage';

// Skip tests if DATABASE_URL is not set
const skipIfNoDatabase = !process.env.DATABASE_URL;

// Mock the tokenStorage to track delete calls
vi.mock('./token-storage', () => ({
  tokenStorage: {
    deleteToken: vi.fn(),
  },
}));

const mockedTokenStorage = vi.mocked(tokenStorage);

describe.skipIf(skipIfNoDatabase)('Slack Helpers Database Integration Tests', () => {
  // Test data IDs
  let testOrganizationId: string;
  let testUserId: string;
  const createdIntegrationIds: string[] = [];

  // Helper to generate unique test data identifiers
  const generateTestIds = () => ({
    teamId: `T${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    botUserId: `U${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    enterpriseId: `E${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    oauthState: `state-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  });

  beforeAll(async () => {
    if (skipIfNoDatabase) {
      console.log('Skipping Slack helpers database integration tests - DATABASE_URL not set');
      return;
    }

    // Create test organization
    testOrganizationId = crypto.randomUUID();
    const [org] = await db
      .insert(organizations)
      .values({
        id: testOrganizationId,
        name: `Test Org ${Date.now()}`,
      })
      .returning();

    // Create test user
    testUserId = crypto.randomUUID();
    const [user] = await db
      .insert(users)
      .values({
        id: testUserId,
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
      })
      .returning();

    // Create user-to-organization relationship
    await db.insert(usersToOrganizations).values({
      userId: testUserId,
      organizationId: testOrganizationId,
      role: 'workspace_admin',
      createdBy: testUserId,
      updatedBy: testUserId,
    });
  });

  afterAll(async () => {
    if (!skipIfNoDatabase) {
      // Clean up all created integrations
      for (const id of createdIntegrationIds) {
        try {
          await db.delete(slackIntegrations).where(eq(slackIntegrations.id, id));
        } catch (error) {
          console.error(`Failed to clean up integration ${id}:`, error);
        }
      }

      // Clean up user-to-organization relationship
      await db
        .delete(usersToOrganizations)
        .where(
          and(
            eq(usersToOrganizations.userId, testUserId),
            eq(usersToOrganizations.organizationId, testOrganizationId)
          )
        );

      // Clean up test user
      await db.delete(users).where(eq(users.id, testUserId));

      // Clean up test organization
      await db.delete(organizations).where(eq(organizations.id, testOrganizationId));
    }
  });

  beforeEach(async () => {
    if (!skipIfNoDatabase) {
      // Clean up any existing integrations for this organization before each test
      await db
        .delete(slackIntegrations)
        .where(eq(slackIntegrations.organizationId, testOrganizationId));
    }
  });

  describe('getActiveIntegration', () => {
    it('should return null when no integration exists', async () => {
      const result = await slackHelpers.getActiveIntegration(testOrganizationId);
      expect(result).toBeNull();
    });

    it('should return active integration when it exists', async () => {
      const testIds = generateTestIds();

      // Create an active integration
      const [integration] = await db
        .insert(slackIntegrations)
        .values({
          organizationId: testOrganizationId,
          userId: testUserId,
          status: 'active',
          teamId: testIds.teamId,
          teamName: 'Test Workspace',
          teamDomain: 'test-workspace',
          botUserId: testIds.botUserId,
          scope: 'channels:read chat:write',
          tokenVaultKey: `test-token-key-${Date.now()}`,
        })
        .returning();

      createdIntegrationIds.push(integration!.id);

      const result = await slackHelpers.getActiveIntegration(testOrganizationId);

      expect(result).toBeTruthy();
      expect(result?.id).toBe(integration!.id);
      expect(result?.status).toBe('active');
      expect(result?.teamName).toBe('Test Workspace');
      expect(result?.organizationId).toBe(testOrganizationId);
    });

    it('should not return deleted integrations', async () => {
      const testIds = generateTestIds();

      // Create a deleted integration
      const [integration] = await db
        .insert(slackIntegrations)
        .values({
          organizationId: testOrganizationId,
          userId: testUserId,
          status: 'active',
          teamId: testIds.teamId,
          teamName: 'Deleted Workspace',
          deletedAt: new Date().toISOString(),
        })
        .returning();

      createdIntegrationIds.push(integration!.id);

      const result = await slackHelpers.getActiveIntegration(testOrganizationId);
      expect(result).toBeNull();
    });
  });

  describe('createPendingIntegration', () => {
    it('should create a new pending integration', async () => {
      const testIds = generateTestIds();
      const metadata = { returnUrl: '/dashboard', source: 'settings' };

      const integrationId = await slackHelpers.createPendingIntegration({
        organizationId: testOrganizationId,
        userId: testUserId,
        oauthState: testIds.oauthState,
        oauthMetadata: metadata,
      });

      expect(integrationId).toBeTruthy();
      createdIntegrationIds.push(integrationId);

      // Verify it was created correctly
      const [created] = await db
        .select()
        .from(slackIntegrations)
        .where(eq(slackIntegrations.id, integrationId));

      expect(created).toBeTruthy();
      expect(created!.organizationId).toBe(testOrganizationId);
      expect(created!.userId).toBe(testUserId);
      expect(created!.status).toBe('pending');
      expect(created!.oauthState).toBe(testIds.oauthState);
      expect(created!.oauthMetadata).toEqual(metadata);

      // Check expiry is set to ~15 minutes
      const expiryTime = new Date(created!.oauthExpiresAt!).getTime();
      const expectedExpiry = Date.now() + 15 * 60 * 1000;
      expect(Math.abs(expiryTime - expectedExpiry)).toBeLessThan(30000); // Within 30 seconds
    });

    it('should throw error if active integration already exists', async () => {
      const testIds = generateTestIds();

      // Create an active integration
      const [activeIntegration] = await db
        .insert(slackIntegrations)
        .values({
          organizationId: testOrganizationId,
          userId: testUserId,
          status: 'active',
          teamId: testIds.teamId,
          teamName: 'Active Workspace',
        })
        .returning();

      createdIntegrationIds.push(activeIntegration!.id);

      // Try to create a new pending integration
      await expect(
        slackHelpers.createPendingIntegration({
          organizationId: testOrganizationId,
          userId: testUserId,
          oauthState: 'should-fail',
        })
      ).rejects.toThrow('Organization already has an active Slack integration');
    });
  });

  describe('updateIntegrationAfterOAuth', () => {
    it('should update pending integration to active', async () => {
      const testIds = generateTestIds();

      // Create a pending integration
      const [pending] = await db
        .insert(slackIntegrations)
        .values({
          organizationId: testOrganizationId,
          userId: testUserId,
          status: 'pending',
          oauthState: testIds.oauthState,
          oauthExpiresAt: new Date(Date.now() + 900000).toISOString(),
        })
        .returning();

      createdIntegrationIds.push(pending!.id);

      // Update it with OAuth response data
      await slackHelpers.updateIntegrationAfterOAuth(pending!.id, {
        teamId: testIds.teamId,
        teamName: 'OAuth Workspace',
        teamDomain: 'oauth-workspace',
        enterpriseId: testIds.enterpriseId,
        botUserId: testIds.botUserId,
        scope: 'channels:read chat:write channels:join',
        tokenVaultKey: `slack-token-${pending!.id}`,
        installedBySlackUserId: 'U11111',
      });

      // Verify the update
      const [updated] = await db
        .select()
        .from(slackIntegrations)
        .where(eq(slackIntegrations.id, pending!.id));

      expect(updated!.status).toBe('active');
      expect(updated!.teamId).toBe(testIds.teamId);
      expect(updated!.teamName).toBe('OAuth Workspace');
      expect(updated!.teamDomain).toBe('oauth-workspace');
      expect(updated!.enterpriseId).toBe(testIds.enterpriseId);
      expect(updated!.botUserId).toBe(testIds.botUserId);
      expect(updated!.scope).toBe('channels:read chat:write channels:join');
      expect(updated!.tokenVaultKey).toBe(`slack-token-${pending!.id}`);
      expect(updated!.installedBySlackUserId).toBe('U11111');
      expect(updated!.installedAt).toBeTruthy();
      expect(updated!.oauthState).toBeNull();
      expect(updated!.oauthExpiresAt).toBeNull();
    });
  });

  describe('updateDefaultChannel', () => {
    it('should update the default channel for an integration', async () => {
      const testIds = generateTestIds();

      // Create an active integration
      const [integration] = await db
        .insert(slackIntegrations)
        .values({
          organizationId: testOrganizationId,
          userId: testUserId,
          status: 'active',
          teamId: testIds.teamId,
          teamName: 'Test Workspace',
          botUserId: testIds.botUserId,
          scope: 'channels:read',
          tokenVaultKey: `test-token-${Date.now()}`,
        })
        .returning();

      createdIntegrationIds.push(integration!.id);

      // Update default channel
      const defaultChannel = {
        name: 'general',
        id: 'C12345',
      };

      await slackHelpers.updateDefaultChannel(integration!.id, defaultChannel);

      // Verify the update
      const [updated] = await db
        .select()
        .from(slackIntegrations)
        .where(eq(slackIntegrations.id, integration!.id));

      expect(updated!.defaultChannel).toEqual(defaultChannel);
      expect(new Date(updated!.updatedAt).getTime()).toBeGreaterThan(
        new Date(updated!.createdAt).getTime()
      );
    });
  });

  describe('softDeleteIntegration', () => {
    it('should soft delete an integration', async () => {
      const testIds = generateTestIds();

      // Create an active integration
      const [integration] = await db
        .insert(slackIntegrations)
        .values({
          organizationId: testOrganizationId,
          userId: testUserId,
          status: 'active',
          teamId: testIds.teamId,
          teamName: 'To Delete Workspace',
          botUserId: testIds.botUserId,
          scope: 'channels:read',
          tokenVaultKey: `test-token-${Date.now()}`,
        })
        .returning();

      createdIntegrationIds.push(integration!.id);

      // Soft delete it
      await slackHelpers.softDeleteIntegration(integration!.id);

      // Verify it was soft deleted
      const [deleted] = await db
        .select()
        .from(slackIntegrations)
        .where(eq(slackIntegrations.id, integration!.id));

      expect(deleted!.status).toBe('revoked');
      expect(deleted!.deletedAt).toBeTruthy();
      expect(new Date(deleted!.updatedAt).getTime()).toBeGreaterThan(
        new Date(deleted!.createdAt).getTime()
      );
    });
  });

  describe('updateLastUsedAt', () => {
    it('should update the last used timestamp', async () => {
      const testIds = generateTestIds();

      // Create an active integration
      const [integration] = await db
        .insert(slackIntegrations)
        .values({
          organizationId: testOrganizationId,
          userId: testUserId,
          status: 'active',
          teamId: testIds.teamId,
          teamName: 'Test Workspace',
          botUserId: testIds.botUserId,
          scope: 'channels:read',
          tokenVaultKey: `test-token-${Date.now()}`,
        })
        .returning();

      createdIntegrationIds.push(integration!.id);

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Update last used
      await slackHelpers.updateLastUsedAt(integration!.id);

      // Verify the update
      const [updated] = await db
        .select()
        .from(slackIntegrations)
        .where(eq(slackIntegrations.id, integration!.id));

      expect(updated!.lastUsedAt).toBeTruthy();
      expect(new Date(updated!.lastUsedAt!).getTime()).toBeGreaterThan(
        new Date(updated!.createdAt).getTime()
      );
    });
  });

  describe('hasActiveIntegration', () => {
    it('should return false when no active integration exists', async () => {
      const result = await slackHelpers.hasActiveIntegration(testOrganizationId);
      expect(result).toBe(false);
    });

    it('should return true when active integration exists', async () => {
      const testIds = generateTestIds();

      // Create an active integration
      const [integration] = await db
        .insert(slackIntegrations)
        .values({
          organizationId: testOrganizationId,
          userId: testUserId,
          status: 'active',
          teamId: testIds.teamId,
          teamName: 'Test Workspace',
        })
        .returning();

      createdIntegrationIds.push(integration!.id);

      const result = await slackHelpers.hasActiveIntegration(testOrganizationId);
      expect(result).toBe(true);
    });
  });

  describe('getPendingIntegrationByState', () => {
    it('should return pending integration with valid state', async () => {
      const testIds = generateTestIds();

      const [integration] = await db
        .insert(slackIntegrations)
        .values({
          organizationId: testOrganizationId,
          userId: testUserId,
          status: 'pending',
          oauthState: testIds.oauthState,
          oauthExpiresAt: new Date(Date.now() + 900000).toISOString(), // 15 mins from now
        })
        .returning();

      createdIntegrationIds.push(integration!.id);

      const result = await slackHelpers.getPendingIntegrationByState(testIds.oauthState);

      expect(result).toBeTruthy();
      expect(result?.id).toBe(integration!.id);
      expect(result?.oauthState).toBe(testIds.oauthState);
    });

    it('should not return expired integrations', async () => {
      const testIds = generateTestIds();

      const [integration] = await db
        .insert(slackIntegrations)
        .values({
          organizationId: testOrganizationId,
          userId: testUserId,
          status: 'pending',
          oauthState: testIds.oauthState,
          oauthExpiresAt: new Date(Date.now() - 60000).toISOString(), // 1 min ago
        })
        .returning();

      createdIntegrationIds.push(integration!.id);

      const result = await slackHelpers.getPendingIntegrationByState(testIds.oauthState);
      expect(result).toBeNull();
    });
  });

  describe('cleanupExpiredPendingIntegrations', () => {
    it('should delete expired pending integrations', async () => {
      const testIds1 = generateTestIds();
      const testIds2 = generateTestIds();

      // Create an expired pending integration
      const [expired] = await db
        .insert(slackIntegrations)
        .values({
          organizationId: testOrganizationId,
          userId: testUserId,
          status: 'pending',
          oauthState: testIds1.oauthState,
          oauthExpiresAt: new Date(Date.now() - 60000).toISOString(), // 1 min ago
        })
        .returning();

      // Create a valid pending integration
      const [valid] = await db
        .insert(slackIntegrations)
        .values({
          organizationId: testOrganizationId,
          userId: testUserId,
          status: 'pending',
          oauthState: testIds2.oauthState,
          oauthExpiresAt: new Date(Date.now() + 900000).toISOString(), // 15 mins from now
        })
        .returning();

      createdIntegrationIds.push(valid!.id); // Only track valid one since expired will be deleted

      // Run cleanup
      const deletedCount = await slackHelpers.cleanupExpiredPendingIntegrations();

      expect(deletedCount).toBe(1);

      // Verify expired was deleted
      const [expiredCheck] = await db
        .select()
        .from(slackIntegrations)
        .where(eq(slackIntegrations.id, expired!.id));

      expect(expiredCheck).toBeUndefined();

      // Verify valid still exists
      const [validCheck] = await db
        .select()
        .from(slackIntegrations)
        .where(eq(slackIntegrations.id, valid!.id));

      expect(validCheck).toBeTruthy();
    });
  });
});
