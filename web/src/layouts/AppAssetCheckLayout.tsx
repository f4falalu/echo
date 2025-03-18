import React from 'react';
import { getSupabaseServerContext } from '@/context/Supabase/getSupabaseServerContext';
import { ShareAssetType } from '@/api/asset_interfaces';
import { ClientSideAnonCheck } from './ClientSideAnonCheck';
import { redirect } from 'next/navigation';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { AppPasswordAccess } from '@/controllers/AppPasswordAccess';
import { AppNoPageAccess } from '@/controllers/AppNoPageAccess';
import { signInWithAnonymousUser } from '@/server_context/supabaseAuthMethods';
import { prefetchAssetCheck } from '@/api/buster_rest/assets/queryRequests';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

export type AppAssetCheckLayoutProps = {
  metricId?: string;
  dashboardId?: string;
  type: 'metric' | 'dashboard';
};

export const AppAssetCheckLayout: React.FC<
  {
    children: React.ReactNode;
  } & AppAssetCheckLayoutProps
> = async ({ children, type, ...props }) => {
  const { accessToken, user } = await getSupabaseServerContext();
  const isMetric = type === 'metric';

  let jwtToken = accessToken;

  if (!user || !accessToken) {
    const { session } = await signInWithAnonymousUser();
    jwtToken = session?.access_token! || accessToken;
  }

  if (!jwtToken) {
    return redirect(
      createBusterRoute({
        route: BusterRoutes.AUTH_LOGIN
      })
    );
  }

  const { res, queryClient } = await prefetchAssetCheck({
    fileType: type,
    assetId: isMetric ? props.metricId! : props.dashboardId!,
    jwtToken
  });

  if (!res) {
    return redirect(
      createBusterRoute({
        route: BusterRoutes.APP_HOME
      })
    );
  }

  const { has_access, password_required, public: pagePublic } = res;

  const Component = (() => {
    if (has_access || (pagePublic && !password_required)) {
      return <ClientSideAnonCheck jwtToken={jwtToken}>{children}</ClientSideAnonCheck>;
    }

    if (pagePublic && password_required) {
      return (
        <ClientSideAnonCheck jwtToken={jwtToken}>
          <AppPasswordAccess
            metricId={props.metricId}
            dashboardId={props.dashboardId}
            type={type as ShareAssetType}>
            {children}
          </AppPasswordAccess>
        </ClientSideAnonCheck>
      );
    }

    if (!has_access && !pagePublic) {
      return (
        <ClientSideAnonCheck jwtToken={jwtToken}>
          <AppNoPageAccess metricId={props.metricId} dashboardId={props.dashboardId} />
        </ClientSideAnonCheck>
      );
    }

    return <>{children}</>;
  })();

  return <HydrationBoundary state={dehydrate(queryClient)}>{Component}</HydrationBoundary>;
};
