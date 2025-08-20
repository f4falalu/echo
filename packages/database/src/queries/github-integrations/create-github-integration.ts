import { db } from '../../connection';
import { githubIntegrations } from '../../schema';

/**
 * Create a new GitHub integration
 */
export async function createGithubIntegration(data: {
  organizationId: string;
  userId: string;
  githubOrgId: string;
  installationId: string;
  githubOrgName?: string;
  tokenVaultKey?: string;
  webhookSecretVaultKey?: string;
  status?: 'pending' | 'active' | 'suspended' | 'revoked';
}) {
  const [integration] = await db
    .insert(githubIntegrations)
    .values({
      organizationId: data.organizationId,
      userId: data.userId,
      githubOrgId: data.githubOrgId,
      installationId: data.installationId,
      githubOrgName: data.githubOrgName,
      tokenVaultKey: data.tokenVaultKey,
      webhookSecretVaultKey: data.webhookSecretVaultKey,
      status: data.status || 'pending',
      installedAt: new Date().toISOString(),
    })
    .returning();

  return integration;
}
