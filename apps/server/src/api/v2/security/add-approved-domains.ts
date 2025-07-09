import type {
  AddApprovedDomainRequest,
  AddApprovedDomainsResponse,
} from '@buster/server-shared/security';
import type { User } from '@buster/database';

export async function addApprovedDomainsHandler(
  request: AddApprovedDomainRequest,
  user: User
): Promise<AddApprovedDomainsResponse> {
  // TODO: Implement add approved domains logic
  return request.domains.map((domain) => ({
    domain,
    created_at: new Date().toISOString(),
  }));
}