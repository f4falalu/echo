import type { GetApprovedDomainsResponse } from '@buster/server-shared/security';
import { type User } from '@buster/database';
import { validateUserOrganization, fetchOrganization } from './security-utils';
import { DomainService } from './domain-service';

const domainService = new DomainService();

export async function getApprovedDomainsHandler(
  user: User
): Promise<GetApprovedDomainsResponse> {
  // Validate user organization
  const userOrg = await validateUserOrganization(user.id);

  // Fetch organization
  const org = await fetchOrganization(userOrg.organizationId);

  // Return formatted domains response
  return domainService.formatDomainsResponse(org.domains, org.createdAt);
}