import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../connection';
import { githubIntegrations } from '../../schema';

/**
 * Get active GitHub integration by organization ID
 */
export async function getActiveGithubIntegration(organizationId: string) {
  const [integration] = await db
    .select()
    .from(githubIntegrations)
    .where(
      and(
        eq(githubIntegrations.organizationId, organizationId),
        eq(githubIntegrations.status, 'active'),
        isNull(githubIntegrations.deletedAt)
      )
    )
    .limit(1);

  return integration;
}
