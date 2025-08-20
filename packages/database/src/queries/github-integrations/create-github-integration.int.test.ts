import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../../connection';
import { githubIntegrations, organizations, users } from '../../schema';
import { createGithubIntegration } from './create-github-integration';

describe('createGithubIntegration', () => {
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

  it('should create a new GitHub integration with all fields', async () => {
    const integrationData = {
      organizationId: testOrgId,
      userId: testUserId,
      githubOrgId: 'github-org-123',
      installationId: 'installation-123',
      githubOrgName: 'Test GitHub Org',
      tokenVaultKey: 'vault-key-123',
      webhookSecretVaultKey: 'webhook-vault-key-123',
      status: 'active' as const,
    };

    const integration = await createGithubIntegration(integrationData);

    expect(integration).toBeDefined();
    expect(integration.organizationId).toBe(testOrgId);
    expect(integration.userId).toBe(testUserId);
    expect(integration.githubOrgId).toBe('github-org-123');
    expect(integration.installationId).toBe('installation-123');
    expect(integration.githubOrgName).toBe('Test GitHub Org');
    expect(integration.tokenVaultKey).toBe('vault-key-123');
    expect(integration.webhookSecretVaultKey).toBe('webhook-vault-key-123');
    expect(integration.status).toBe('active');
    expect(integration.installedAt).toBeDefined();
  });

  it('should create integration with default pending status', async () => {
    const integration = await createGithubIntegration({
      organizationId: testOrgId,
      userId: testUserId,
      githubOrgId: 'github-org-456',
      installationId: 'installation-456',
    });

    expect(integration.status).toBe('pending');
  });

  it('should create integration with minimal required fields', async () => {
    const integration = await createGithubIntegration({
      organizationId: testOrgId,
      userId: testUserId,
      githubOrgId: 'github-org-789',
      installationId: 'installation-789',
    });

    expect(integration).toBeDefined();
    expect(integration.organizationId).toBe(testOrgId);
    expect(integration.userId).toBe(testUserId);
    expect(integration.githubOrgId).toBe('github-org-789');
    expect(integration.installationId).toBe('installation-789');
    expect(integration.status).toBe('pending');
    expect(integration.githubOrgName).toBeNull();
    expect(integration.tokenVaultKey).toBeNull();
    expect(integration.webhookSecretVaultKey).toBeNull();
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
