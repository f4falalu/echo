import type { GetApprovedDomainsResponse } from '@buster/server-shared/security';
import type { User } from '@buster/database';

export async function getApprovedDomainsHandler(
  user: User
): Promise<GetApprovedDomainsResponse> {
  // TODO: Implement get approved domains logic
  return [
    {
      domain: 'example.com',
      created_at: new Date().toISOString(),
    },
  ];
}