import type React from 'react';
import type { PropsWithChildren } from 'react';
import { BusterPosthogProvider } from '@/context/Posthog';
import { BusterStyleProvider } from './BusterStyles';

import {
  SupabaseContextProvider,
  type SupabaseContextType,
} from './Supabase/SupabaseContextProvider';

export const RootProviders: React.FC<PropsWithChildren> = ({ children }) => {
  return <BusterStyleProvider>{children}</BusterStyleProvider>;
};

export const AppProviders: React.FC<PropsWithChildren<SupabaseContextType>> = ({
  children,
  supabaseUser,
  accessToken,
}) => {
  return (
    <SupabaseContextProvider supabaseUser={supabaseUser} accessToken={accessToken}>
      <BusterPosthogProvider>{children}</BusterPosthogProvider>
    </SupabaseContextProvider>
  );
};
