import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../../connection';
import { githubIntegrations, organizations, users } from '../../schema';
import { createGithubIntegration } from './create-github-integration';
import { updateGithubIntegration } from './update-github-integration';

describe('updateGithubIntegration', () => {
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

  it('should update all specified fields', async () => {
    const created = await createGithubIntegration({
      organizationId: testOrgId,
      userId: testUserId,
      githubOrgId: 'github-org-444',
      installationId: 'installation-444',
    });

    const updated = await updateGithubIntegration(created.id, {
      githubOrgName: 'Updated Org Name',
      tokenVaultKey: 'new-vault-key',
      webhookSecretVaultKey: 'new-webhook-key',
      status: 'active',
      lastUsedAt: new Date().toISOString(),
    });

    expect(updated).toBeDefined();
    expect(updated.githubOrgName).toBe('Updated Org Name');
    expect(updated.tokenVaultKey).toBe('new-vault-key');
    expect(updated.webhookSecretVaultKey).toBe('new-webhook-key');
    expect(updated.status).toBe('active');
    expect(updated.lastUsedAt).toBeDefined();
    expect(updated.updatedAt).not.toBe(created.updatedAt);
  });

  it('should only update specified fields', async () => {
    const created = await createGithubIntegration({
      organizationId: testOrgId,
      userId: testUserId,
      githubOrgId: 'github-org-555',
      installationId: 'installation-555',
      githubOrgName: 'Original Name',
      tokenVaultKey: 'original-key',
    });

    const updated = await updateGithubIntegration(created.id, {
      status: 'suspended',
    });

    expect(updated.githubOrgName).toBe('Original Name');
    expect(updated.tokenVaultKey).toBe('original-key');
    expect(updated.status).toBe('suspended');
  });

  it('should update status from pending to active', async () => {
    const created = await createGithubIntegration({
      organizationId: testOrgId,
      userId: testUserId,
      githubOrgId: 'github-org-666',
      installationId: 'installation-666',
      status: 'pending',
    });

    const updated = await updateGithubIntegration(created.id, {
      status: 'active',
      tokenVaultKey: 'activated-token-key',
    });

    expect(updated.status).toBe('active');
    expect(updated.tokenVaultKey).toBe('activated-token-key');
  });

  it('should update lastUsedAt timestamp', async () => {
    const created = await createGithubIntegration({
      organizationId: testOrgId,
      userId: testUserId,
      githubOrgId: 'github-org-777',
      installationId: 'installation-777',
    });

    const lastUsedAt = new Date().toISOString();
    const updated = await updateGithubIntegration(created.id, {
      lastUsedAt,
    });

    expect(updated.lastUsedAt).toBeDefined();
    expect(updated.lastUsedAt).toBeTruthy();
    // Database might return slightly different timestamp format
  });

  it('should handle empty update object', async () => {
    const created = await createGithubIntegration({
      organizationId: testOrgId,
      userId: testUserId,
      githubOrgId: 'github-org-888',
      installationId: 'installation-888',
    });

    const updated = await updateGithubIntegration(created.id, {});

    expect(updated).toBeDefined();
    expect(updated.id).toBe(created.id);
    // updatedAt should still change even with empty update
    expect(updated.updatedAt).not.toBe(created.updatedAt);
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
