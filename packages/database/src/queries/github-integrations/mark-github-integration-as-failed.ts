import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../connection';
import { githubIntegrations } from '../../schema';

/**
 * Mark GitHub integration as failed
 */
export async function markGithubIntegrationAsFailed(integrationId: string, _errorMessage?: string) {
  const [updated] = await db
    .update(githubIntegrations)
    .set({
      status: 'suspended',
      updatedAt: new Date().toISOString(),
      // Store error in metadata if needed (would need schema update for metadata field)
    })
    .where(and(eq(githubIntegrations.id, integrationId), isNull(githubIntegrations.deletedAt)))
    .returning();

  return updated;
}
