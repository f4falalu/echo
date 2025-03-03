'use client';

import { AppProviders } from '@/context/AppProviders';
import React from 'react';
import { AppLayout } from '@/controllers/AppLayout';
import type { BusterUserResponse } from '@/api/asset_interfaces';
import { useSupabaseServerContext } from '@/context/Supabase/useSupabaseContext';
import { GlobalErrorComponent } from '../../components/ui/error';

export const AppLayoutClient = ({
  children,
  userInfo,
  supabaseContext,
  defaultLayout,

  signOut
}: {
  children: React.ReactNode;
  userInfo: BusterUserResponse | undefined;
  supabaseContext: Awaited<ReturnType<typeof useSupabaseServerContext>>;
  defaultLayout: [string, string];
  signOut: () => void; //DO I really need this here?
}) => {
  return (
    <GlobalErrorComponent>
      <AppProviders userInfo={userInfo} supabaseContext={supabaseContext}>
        {/* <HydrationBoundary state={dehydrate(queryClient)}> */}
        <AppLayout defaultLayout={defaultLayout} signOut={signOut}>
          {children}
        </AppLayout>
        {/* </HydrationBoundary> */}
      </AppProviders>
    </GlobalErrorComponent>
  );
};
