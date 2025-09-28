import { and, count, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { usersToOrganizations } from '../../schema';

/**
 * Get the count of active members in an organization
 * Takes an organization ID and returns the number of users associated with that organization
 */
export async function getOrganizationMemberCount(organizationId: string): Promise<number> {
  try {
    const result = await db
      .select({
        count: count(),
      })
      .from(usersToOrganizations)
      .where(
        and(
          eq(usersToOrganizations.organizationId, organizationId),
          isNull(usersToOrganizations.deletedAt),
          eq(usersToOrganizations.status, 'active')
        )
      );

    return result[0]?.count ?? 0;
  } catch (error) {
    console.error('Error getting organization member count:', error);
    throw error;
  }
}
