import type React from 'react';
import type { PropsWithChildren } from 'react';
import { isDev } from '@/config/dev';
import { BusterPosthogProvider } from '@/context/Posthog';
import { useAppVersion } from './AppVersion/useAppVersion';
import { useWelcomeConsole } from './AppVersion/useWelcomeConsole';
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
  supabaseSession,
}) => {
  if (!isDev) {
    useAppVersion();
    useWelcomeConsole();
  }

  return (
    <SupabaseContextProvider supabaseSession={supabaseSession}>
      <BusterPosthogProvider>{children}</BusterPosthogProvider>
    </SupabaseContextProvider>
  );
};
