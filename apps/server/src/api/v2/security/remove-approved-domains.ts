import type {
  RemoveApprovedDomainRequest,
  RemoveApprovedDomainsResponse,
} from '@buster/server-shared/security';
import type { User } from '@buster/database';

export async function removeApprovedDomainsHandler(
  request: RemoveApprovedDomainRequest,
  user: User
): Promise<RemoveApprovedDomainsResponse> {
  // TODO: Implement remove approved domains logic
  return [];
}