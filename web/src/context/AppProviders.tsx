import React, { PropsWithChildren } from 'react';
import { BusterWebSocketProvider } from './BusterWebSocket';
import { SupabaseContextProvider } from './Supabase/SupabaseContextProvider';
import { UseSupabaseContextType } from './Supabase/getSupabaseServerContext';
import { BusterReactQueryProvider } from './BusterReactQuery/BusterReactQueryAndApi';
import { AppLayoutProvider } from './BusterAppLayout';
import { BusterUserConfigProvider } from './Users/UserConfigProvider';
import { BusterAssetsProvider } from './Assets/BusterAssetsProvider';
import { BusterPosthogProvider } from './Posthog';
import { BusterChatProvider } from './Chats';
import { RoutePrefetcher } from './RoutePrefetcher';
import type { BusterUserResponse } from '@/api/asset_interfaces';

// scan({
//   enabled: true,
//   log: true, // logs render info to console (default: false)
//   clearLog: false // clears the console per group of renders (default: false)
// });

export const AppProviders: React.FC<
  PropsWithChildren<{
    supabaseContext: UseSupabaseContextType;
    userInfo: BusterUserResponse | undefined;
  }>
> = ({ children, supabaseContext, userInfo }) => {
  return (
    <SupabaseContextProvider supabaseContext={supabaseContext}>
      <BusterReactQueryProvider>
        <BusterWebSocketProvider>
          <AppLayoutProvider>
            <BusterUserConfigProvider userInfo={userInfo}>
              <BusterAssetsProvider>
                <BusterChatProvider>
                  <BusterPosthogProvider>
                    {children}
                    <RoutePrefetcher />
                  </BusterPosthogProvider>
                </BusterChatProvider>
              </BusterAssetsProvider>
            </BusterUserConfigProvider>
          </AppLayoutProvider>
        </BusterWebSocketProvider>
      </BusterReactQueryProvider>
    </SupabaseContextProvider>
  );
};
