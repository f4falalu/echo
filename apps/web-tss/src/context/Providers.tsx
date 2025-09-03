import type { QueryClient } from '@tanstack/react-query';
import type React from 'react';
import type { PropsWithChildren } from 'react';
import { BusterPosthogProvider } from '@/context/Posthog';
import { BusterStyleProvider } from './BusterStyles';
import { QueryPersister } from './Query/QueryProvider';
import {
  SupabaseContextProvider,
  type SupabaseContextType,
} from './Supabase/SupabaseContextProvider';

type RootProvidersProps = PropsWithChildren<SupabaseContextType & { queryClient: QueryClient }>;

export const RootProviders: React.FC<RootProvidersProps> = ({
  children,
  user,
  accessToken,
  queryClient,
}) => {
  return (
    <QueryPersister queryClient={queryClient}>
      <SupabaseContextProvider user={user} accessToken={accessToken}>
        <BusterStyleProvider>
          <BusterPosthogProvider>{children}</BusterPosthogProvider>
        </BusterStyleProvider>
      </SupabaseContextProvider>
    </QueryPersister>
  );
};

export const AppProviders: React.FC<PropsWithChildren> = ({ children }) => {
  return <>{children}</>;
};
