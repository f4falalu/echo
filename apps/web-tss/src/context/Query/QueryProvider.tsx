import type { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider as TanstackPersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import React from 'react';
import { persistOptions } from '@/integrations/tanstack-query/create-persister';
import { userQueryKeys } from '../../api/query_keys/users';

export const QueryPersister = ({
  children,
  queryClient,
}: {
  children: React.ReactNode;
  queryClient: QueryClient;
}) => {
  const [mounted, setMounted] = React.useState(false);

  return (
    <TanstackPersistQueryClientProvider
      client={queryClient}
      persistOptions={persistOptions}
      onSuccess={() => {
        setMounted(true);
        queryClient.resumePausedMutations();
        console.log('onSuccess', queryClient.getQueryData(userQueryKeys.favoritesGetList.queryKey));
      }}
    >
      {/* {mounted ? children : null} */}
      {children}
    </TanstackPersistQueryClientProvider>
  );
};
