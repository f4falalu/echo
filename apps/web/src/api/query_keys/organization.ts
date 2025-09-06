import type { OrganizationUser } from '@buster/server-shared/organization';
import { queryOptions } from '@tanstack/react-query';

const organizationUsers = (organizationId: string) =>
  queryOptions<OrganizationUser[]>({
    queryKey: ['organizationUsers', organizationId] as const,
    staleTime: 10 * 1000,
  });

export const organizationQueryKeys = {
  organizationUsers,
};
