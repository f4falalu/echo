import type { QueryClient } from '@tanstack/react-query';
import { userQueryKeys } from '../../query_keys/users';

export const hasOrganizationId = (queryClient: QueryClient): boolean => {
  const organizationId = queryClient.getQueryData(userQueryKeys.userGetUserMyself.queryKey)
    ?.organizations?.[0]?.id;
  return !!organizationId;
};
