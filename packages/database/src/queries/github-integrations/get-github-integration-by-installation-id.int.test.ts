import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../../connection';
import { githubIntegrations, organizations, users } from '../../schema';
import { createGithubIntegration } from './create-github-integration';
import { getGithubIntegrationByInstallationId } from './get-github-integration-by-installation-id';
import { softDeleteGithubIntegration } from './soft-delete-github-integration';

describe('getGithubIntegrationByInstallationId', () => {
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

  it('should return integration by installation ID', async () => {
    const installationId = 'unique-installation-222';
    await createGithubIntegration({
      organizationId: testOrgId,
      userId: testUserId,
      githubOrgId: 'github-org-222',
      installationId,
      status: 'active',
    });

    const integration = await getGithubIntegrationByInstallationId(installationId);

    expect(integration).toBeDefined();
    expect(integration?.installationId).toBe(installationId);
    expect(integration?.organizationId).toBe(testOrgId);
  });

  it('should return integration regardless of status', async () => {
    const installationId = 'pending-installation-333';
    await createGithubIntegration({
      organizationId: testOrgId,
      userId: testUserId,
      githubOrgId: 'github-org-333',
      installationId,
      status: 'pending',
    });

    const integration = await getGithubIntegrationByInstallationId(installationId);

    expect(integration).toBeDefined();
    expect(integration?.installationId).toBe(installationId);
    expect(integration?.status).toBe('pending');
  });

  it('should not return soft-deleted integrations', async () => {
    const installationId = 'deleted-installation-444';
    const created = await createGithubIntegration({
      organizationId: testOrgId,
      userId: testUserId,
      githubOrgId: 'github-org-444',
      installationId,
    });

    await softDeleteGithubIntegration(created.id);

    const integration = await getGithubIntegrationByInstallationId(installationId);

    expect(integration).toBeUndefined();
  });

  it('should return undefined when installation does not exist', async () => {
    const integration = await getGithubIntegrationByInstallationId('non-existent-installation');

    expect(integration).toBeUndefined();
  });

  afterEach(async () => {
    // Clean up test GitHub integrations first (due to foreign key constraints)
    await db.delete(githubIntegrations).where(eq(githubIntegrations.organizationId, testOrgId));

    // Clean up test user
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId));
    }

    // Clean up test organization last
    if (testOrgId) {
      await db.delete(organizations).where(eq(organizations.id, testOrgId));
    }
  });
});
