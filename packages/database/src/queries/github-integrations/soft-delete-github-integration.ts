import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../connection';
import { githubIntegrations } from '../../schema';

/**
 * Soft delete GitHub integration
 */
export async function softDeleteGithubIntegration(integrationId: string) {
  const [deleted] = await db
    .update(githubIntegrations)
    .set({
      deletedAt: new Date().toISOString(),
      status: 'revoked',
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(githubIntegrations.id, integrationId), isNull(githubIntegrations.deletedAt)))
    .returning();

  return deleted;
}
