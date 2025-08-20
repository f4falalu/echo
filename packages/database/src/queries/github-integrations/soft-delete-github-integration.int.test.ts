import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../../connection';
import { githubIntegrations, organizations, users } from '../../schema';
import { createGithubIntegration } from './create-github-integration';
import { getActiveGithubIntegration } from './get-active-github-integration';
import { getGithubIntegrationByInstallationId } from './get-github-integration-by-installation-id';
import { softDeleteGithubIntegration } from './soft-delete-github-integration';

describe('softDeleteGithubIntegration', () => {
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

  it('should soft delete active integration', async () => {
    const created = await createGithubIntegration({
      organizationId: testOrgId,
      userId: testUserId,
      githubOrgId: 'github-org-777',
      installationId: 'installation-777',
      status: 'active',
    });

    const deleted = await softDeleteGithubIntegration(created.id);

    expect(deleted).toBeDefined();
    expect(deleted.deletedAt).toBeDefined();
    expect(deleted.status).toBe('revoked');
    expect(deleted.updatedAt).not.toBe(created.updatedAt);
  });

  it('should make integration unretrievable via getActiveGithubIntegration', async () => {
    const created = await createGithubIntegration({
      organizationId: testOrgId,
      userId: testUserId,
      githubOrgId: 'github-org-888',
      installationId: 'installation-888',
      status: 'active',
    });

    // Verify it exists before deletion
    const beforeDelete = await getActiveGithubIntegration(testOrgId);
    expect(beforeDelete).toBeDefined();
    expect(beforeDelete?.id).toBe(created.id);

    // Soft delete
    await softDeleteGithubIntegration(created.id);

    // Verify it's no longer retrievable
    const afterDelete = await getActiveGithubIntegration(testOrgId);
    expect(afterDelete).toBeUndefined();
  });

  it('should make integration unretrievable via getGithubIntegrationByInstallationId', async () => {
    const installationId = 'installation-999';
    const created = await createGithubIntegration({
      organizationId: testOrgId,
      userId: testUserId,
      githubOrgId: 'github-org-999',
      installationId,
      status: 'active',
    });

    // Verify it exists before deletion
    const beforeDelete = await getGithubIntegrationByInstallationId(installationId);
    expect(beforeDelete).toBeDefined();
    expect(beforeDelete?.id).toBe(created.id);

    // Soft delete
    await softDeleteGithubIntegration(created.id);

    // Verify it's no longer retrievable
    const afterDelete = await getGithubIntegrationByInstallationId(installationId);
    expect(afterDelete).toBeUndefined();
  });

  it('should set status to revoked when soft deleting', async () => {
    const created = await createGithubIntegration({
      organizationId: testOrgId,
      userId: testUserId,
      githubOrgId: 'github-org-111',
      installationId: 'installation-111',
      status: 'pending',
    });

    const deleted = await softDeleteGithubIntegration(created.id);

    expect(deleted.status).toBe('revoked');
    expect(deleted.deletedAt).toBeDefined();
  });

  it('should preserve all other fields when soft deleting', async () => {
    const created = await createGithubIntegration({
      organizationId: testOrgId,
      userId: testUserId,
      githubOrgId: 'github-org-222',
      installationId: 'installation-222',
      githubOrgName: 'Preserved Org Name',
      tokenVaultKey: 'preserved-vault-key',
      webhookSecretVaultKey: 'preserved-webhook-key',
      status: 'active',
    });

    const deleted = await softDeleteGithubIntegration(created.id);

    expect(deleted.organizationId).toBe(testOrgId);
    expect(deleted.userId).toBe(testUserId);
    expect(deleted.githubOrgId).toBe('github-org-222');
    expect(deleted.installationId).toBe('installation-222');
    expect(deleted.githubOrgName).toBe('Preserved Org Name');
    expect(deleted.tokenVaultKey).toBe('preserved-vault-key');
    expect(deleted.webhookSecretVaultKey).toBe('preserved-webhook-key');
    expect(deleted.status).toBe('revoked');
    expect(deleted.deletedAt).toBeDefined();
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
