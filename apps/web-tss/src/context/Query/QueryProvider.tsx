import type { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider as TanstackPersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import type React from 'react';
import { persistOptions } from '@/integrations/tanstack-query/create-persister';
import { userQueryKeys } from '../../api/query_keys/users';

export const QueryPersister = ({
  children,
}: {
  children: React.ReactNode;
  queryClient: QueryClient;
}) => {
  return children;
};
