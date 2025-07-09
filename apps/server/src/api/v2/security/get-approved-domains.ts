import type { GetApprovedDomainsResponse } from '@buster/server-shared/security';
import { 
  type User, 
  db, 
  getUserOrganizationId, 
  organizations, 
  eq, 
  and, 
  isNull 
} from '@buster/database';
import { HTTPException } from 'hono/http-exception';

export async function getApprovedDomainsHandler(
  user: User
): Promise<GetApprovedDomainsResponse> {
  // Get user's organization
  const userOrg = await getUserOrganizationId(user.id);
  
  if (!userOrg) {
    throw new HTTPException(403, {
      message: 'User is not associated with an organization',
    });
  }

  // Fetch organization with approved domains
  const org = await db
    .select({
      domains: organizations.domains,
      createdAt: organizations.createdAt,
    })
    .from(organizations)
    .where(
      and(
        eq(organizations.id, userOrg.organizationId),
        isNull(organizations.deletedAt)
      )
    )
    .limit(1);

  if (!org.length || !org[0]) {
    throw new HTTPException(404, {
      message: 'Organization not found',
    });
  }

  const { domains, createdAt } = org[0];

  // Transform domains array to response format
  // If domains is null or empty, return empty array
  if (!domains || domains.length === 0) {
    return [];
  }

  // Map each domain to include created_at
  // Since we don't track individual domain creation dates,
  // we'll use the organization creation date for now
  return domains.map((domain) => ({
    domain,
    created_at: createdAt,
  }));
}