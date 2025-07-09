import type {
  AddApprovedDomainRequest,
  AddApprovedDomainsResponse,
} from '@buster/server-shared/security';
import { 
  type User, 
  db, 
  getUserOrganizationId, 
  organizations, 
  eq, 
  and, 
  isNull,
  sql
} from '@buster/database';
import { HTTPException } from 'hono/http-exception';

export async function addApprovedDomainsHandler(
  request: AddApprovedDomainRequest,
  user: User
): Promise<AddApprovedDomainsResponse> {
  // Get user's organization
  const userOrg = await getUserOrganizationId(user.id);
  
  if (!userOrg) {
    throw new HTTPException(403, {
      message: 'User is not associated with an organization',
    });
  }

  // Check if user has admin role
  if (userOrg.role !== 'workspace_admin' && userOrg.role !== 'data_admin') {
    throw new HTTPException(403, {
      message: 'Insufficient permissions to manage approved domains',
    });
  }

  // Fetch current organization domains
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

  const currentDomains = org[0].domains || [];
  
  // Normalize domains (lowercase, trim)
  const normalizedNewDomains = request.domains.map(d => d.toLowerCase().trim());
  const normalizedCurrentDomains = currentDomains.map(d => d.toLowerCase().trim());
  
  // Filter out duplicates
  const uniqueNewDomains = normalizedNewDomains.filter(
    domain => !normalizedCurrentDomains.includes(domain)
  );

  // Combine current and new unique domains
  const updatedDomains = [...currentDomains, ...uniqueNewDomains];

  // Update organization with new domains
  await db
    .update(organizations)
    .set({
      domains: updatedDomains,
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(
        eq(organizations.id, userOrg.organizationId),
        isNull(organizations.deletedAt)
      )
    );

  // Return all domains in the response format
  return updatedDomains.map((domain) => ({
    domain,
    created_at: org[0].createdAt,
  }));
}