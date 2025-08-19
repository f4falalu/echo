import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../../connection';
import { githubIntegrations, organizations, users } from '../../schema';
import { createGithubIntegration } from './create-github-integration';
import { getActiveGithubIntegration } from './get-active-github-integration';
import { softDeleteGithubIntegration } from './soft-delete-github-integration';

describe('getActiveGithubIntegration', () => {
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

  it('should return active integration for organization', async () => {
    await createGithubIntegration({
      organizationId: testOrgId,
      userId: testUserId,
      githubOrgId: 'github-org-789',
      installationId: 'installation-789',
      status: 'active',
    });

    const integration = await getActiveGithubIntegration(testOrgId);

    expect(integration).toBeDefined();
    expect(integration?.organizationId).toBe(testOrgId);
    expect(integration?.status).toBe('active');
  });

  it('should not return non-active integrations', async () => {
    await createGithubIntegration({
      organizationId: testOrgId,
      userId: testUserId,
      githubOrgId: 'github-org-999',
      installationId: 'installation-999',
      status: 'pending',
    });

    const integration = await getActiveGithubIntegration(testOrgId);

    expect(integration).toBeUndefined();
  });

  it('should not return suspended integrations', async () => {
    await createGithubIntegration({
      organizationId: testOrgId,
      userId: testUserId,
      githubOrgId: 'github-org-suspended',
      installationId: 'installation-suspended',
      status: 'suspended',
    });

    const integration = await getActiveGithubIntegration(testOrgId);

    expect(integration).toBeUndefined();
  });

  it('should not return soft-deleted integrations', async () => {
    const created = await createGithubIntegration({
      organizationId: testOrgId,
      userId: testUserId,
      githubOrgId: 'github-org-111',
      installationId: 'installation-111',
      status: 'active',
    });

    await softDeleteGithubIntegration(created.id);

    const integration = await getActiveGithubIntegration(testOrgId);

    expect(integration).toBeUndefined();
  });

  it('should return undefined when no integration exists', async () => {
    const integration = await getActiveGithubIntegration(testOrgId);

    expect(integration).toBeUndefined();
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
