import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../connection';
import { githubIntegrations } from '../../schema';

/**
 * Update GitHub integration
 */
export async function updateGithubIntegration(
  integrationId: string,
  data: {
    githubOrgName?: string;
    tokenVaultKey?: string;
    webhookSecretVaultKey?: string;
    status?: 'pending' | 'active' | 'suspended' | 'revoked';
    lastUsedAt?: string;
  }
) {
  const updateData: Record<string, string | undefined> = {
    updatedAt: new Date().toISOString(),
  };

  // Only add defined fields to update
  if (data.githubOrgName !== undefined) updateData.githubOrgName = data.githubOrgName;
  if (data.tokenVaultKey !== undefined) updateData.tokenVaultKey = data.tokenVaultKey;
  if (data.webhookSecretVaultKey !== undefined)
    updateData.webhookSecretVaultKey = data.webhookSecretVaultKey;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.lastUsedAt !== undefined) updateData.lastUsedAt = data.lastUsedAt;

  const [updated] = await db
    .update(githubIntegrations)
    .set(updateData)
    .where(and(eq(githubIntegrations.id, integrationId), isNull(githubIntegrations.deletedAt)))
    .returning();

  return updated;
}
