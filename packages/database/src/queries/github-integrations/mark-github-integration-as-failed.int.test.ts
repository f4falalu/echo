import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../../connection';
import { githubIntegrations, organizations, users } from '../../schema';
import { createGithubIntegration } from './create-github-integration';
import { markGithubIntegrationAsFailed } from './mark-github-integration-as-failed';

describe('markGithubIntegrationAsFailed', () => {
  let testOrgId: string;
  let testUserId: string;

  beforeEach(async () => {
    // Create test organization
    const [org] = await db
      .insert(organizations)
      .values({
        id: randomUUID(),
        name: `Test Org ${Date.now()}-${randomUUID().slice(0, 8)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();
    testOrgId = org.id;

    // Create test user
    const [user] = await db
      .insert(users)
      .values({
        id: randomUUID(),
        email: `test-${Date.now()}-${randomUUID().slice(0, 8)}@example.com`,
        name: 'Test User',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();
    testUserId = user.id;
  });

  it('should mark active integration as suspended', async () => {
    const created = await createGithubIntegration({
      organizationId: testOrgId,
      userId: testUserId,
      githubOrgId: 'github-org-666',
      installationId: 'installation-666',
      status: 'active',
    });

    const updated = await markGithubIntegrationAsFailed(created.id, 'Test error message');

    expect(updated).toBeDefined();
    expect(updated.status).toBe('suspended');
    expect(updated.updatedAt).not.toBe(created.updatedAt);
  });

  it('should mark pending integration as suspended', async () => {
    const created = await createGithubIntegration({
      organizationId: testOrgId,
      userId: testUserId,
      githubOrgId: 'github-org-777',
      installationId: 'installation-777',
      status: 'pending',
    });

    const updated = await markGithubIntegrationAsFailed(created.id);

    expect(updated).toBeDefined();
    expect(updated.status).toBe('suspended');
  });

  it('should handle error message parameter', async () => {
    const created = await createGithubIntegration({
      organizationId: testOrgId,
      userId: testUserId,
      githubOrgId: 'github-org-888',
      installationId: 'installation-888',
      status: 'active',
    });

    const errorMessage = 'Authentication failed: Invalid token';
    const updated = await markGithubIntegrationAsFailed(created.id, errorMessage);

    expect(updated).toBeDefined();
    expect(updated.status).toBe('suspended');
    // Note: Error message is currently not stored in the database
    // This is just passed for potential future use
  });

  it('should preserve other fields when marking as failed', async () => {
    const created = await createGithubIntegration({
      organizationId: testOrgId,
      userId: testUserId,
      githubOrgId: 'github-org-999',
      installationId: 'installation-999',
      githubOrgName: 'Test Org',
      tokenVaultKey: 'test-vault-key',
      status: 'active',
    });

    const updated = await markGithubIntegrationAsFailed(created.id);

    expect(updated.githubOrgName).toBe('Test Org');
    expect(updated.tokenVaultKey).toBe('test-vault-key');
    expect(updated.organizationId).toBe(testOrgId);
    expect(updated.installationId).toBe('installation-999');
    expect(updated.status).toBe('suspended');
  });

  afterEach(async () => {
    // Clean up test GitHub integrations
    await db.delete(githubIntegrations).where(eq(githubIntegrations.organizationId, testOrgId));

    // Clean up test user
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId));
    }

    // Clean up test organization
    if (testOrgId) {
      await db.delete(organizations).where(eq(organizations.id, testOrgId));
    }
  });
});
