import type React from 'react';
import type { PropsWithChildren } from 'react';
import { BusterStyleProvider } from './BusterStyles';
import {
  SupabaseContextProvider,
  type SupabaseContextType
} from './Supabase/SupabaseContextProvider';
// import type { UseSupabaseUserContextType } from '@/lib/supabase';
// import { BusterAssetsProvider } from './Assets/BusterAssetsProvider';
// import { AppLayoutProvider } from './BusterAppLayout';
// import { BusterReactQueryProvider } from './BusterReactQuery/BusterReactQueryAndApi';
// import { BusterNewChatProvider } from './Chats';
// import { BusterPosthogProvider } from './Posthog';
// import { RoutePrefetcher } from './RoutePrefetcher';
// import { SupabaseContextProvider } from './Supabase/SupabaseContextProvider';
// import { BusterUserConfigProvider } from './Users/BusterUserConfigProvider';

// scan({
//   enabled: true,
//   log: true, // logs render info to console (default: false)
//   clearLog: false // clears the console per group of renders (default: false)
// });

export const AppProviders: React.FC<PropsWithChildren<SupabaseContextType>> = ({
  children,
  accessToken,
  user
}) => {
  return (
    <SupabaseContextProvider accessToken={accessToken} user={user}>
      <BusterStyleProvider>{children}</BusterStyleProvider>
      {/* <BusterReactQueryProvider>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <AppLayoutProvider>
            <BusterUserConfigProvider>
              <BusterAssetsProvider>
                <BusterNewChatProvider>
                  <BusterPosthogProvider>{children}</BusterPosthogProvider>
                  <RoutePrefetcher />
                </BusterNewChatProvider>
              </BusterAssetsProvider>
            </BusterUserConfigProvider>
          </AppLayoutProvider>
        </HydrationBoundary>
      </BusterReactQueryProvider> */}
    </SupabaseContextProvider>
  );
};
