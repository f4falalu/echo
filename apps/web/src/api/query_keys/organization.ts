import { queryOptions } from '@tanstack/react-query';
import type { OrganizationUser } from '@buster/server-shared/organization';

const organizationUsers = (organizationId: string) =>
  queryOptions<OrganizationUser[]>({
    queryKey: ['organizationUsers', organizationId] as const,
    staleTime: 10 * 1000
  });

export const organizationQueryKeys = {
  organizationUsers
};
