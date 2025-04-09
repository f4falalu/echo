'use server';

import React from 'react';
import { BusterDashboardResponse, IBusterMetric, ShareAssetType } from '@/api/asset_interfaces';
import { AppPasswordAccess } from '@/controllers/AppPasswordAccess';
import { AppNoPageAccess } from '@/controllers/AppNoPageAccess';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { AppAssetLoadingContainer } from './AppAssetLoadingContainer';
import { prefetchGetMetric } from '@/api/buster_rest/metrics/queryReqestsServer';
import { prefetchGetDashboard } from '@/api/buster_rest/dashboards/queryServerRequests';
import { metricsQueryKeys } from '@/api/query_keys/metric';
import { dashboardQueryKeys } from '@/api/query_keys/dashboard';
import { HydrationBoundaryAssetStore } from '@/context/Assets/HydrationBoundaryAssetStore';

export type AppAssetCheckLayoutProps = {
  assetId: string;
  type: 'metric' | 'dashboard';
  versionNumber?: number;
};

export const AppAssetCheckLayout: React.FC<
  {
    children: React.ReactNode;
  } & AppAssetCheckLayoutProps
> = async ({ children, type, assetId, versionNumber }) => {
  const queryClient = await prefetchAsset(assetId, type, versionNumber);

  const {
    has_access,
    password_required,
    public: pagePublic,
    queryData
  } = getAssetAccess({ assetId, type, queryClient });

  const Component = (() => {
    if (!has_access && !pagePublic) {
      return <AppNoPageAccess assetId={assetId} />;
    }

    if (pagePublic && password_required) {
      return (
        <AppPasswordAccess assetId={assetId} type={type as ShareAssetType}>
          {children}
        </AppPasswordAccess>
      );
    }

    return <>{children}</>;
  })();

  const dehydratedState = dehydrate(queryClient, {
    shouldDehydrateQuery: () => true,
    shouldRedactErrors: () => false
  });

  return (
    <HydrationBoundary state={dehydratedState}>
      <HydrationBoundaryAssetStore asset={queryData}>
        <AppAssetLoadingContainer assetId={assetId} type={type} versionNumber={versionNumber}>
          {Component}
        </AppAssetLoadingContainer>
      </HydrationBoundaryAssetStore>
    </HydrationBoundary>
  );
};

const prefetchAsset = async (
  assetId: string,
  type: 'metric' | 'dashboard',
  versionNumber?: number
) => {
  let queryClient = new QueryClient();

  switch (type) {
    case 'metric':
      queryClient = await prefetchGetMetric(
        { id: assetId, version_number: versionNumber },
        queryClient
      );
      break;
    case 'dashboard':
      queryClient = await prefetchGetDashboard(
        { id: assetId, version_number: versionNumber },
        queryClient
      );
      break;
    default:
      const _exhaustiveCheck: never = type;
  }

  return queryClient;
};

const getAssetAccess = ({
  assetId,
  type,
  queryClient
}: {
  assetId: string;
  type: AppAssetCheckLayoutProps['type'];
  queryClient: QueryClient;
}): {
  has_access: boolean;
  password_required: boolean;
  public: boolean;
  queryData?: IBusterMetric | BusterDashboardResponse | undefined;
} => {
  const options =
    type === 'metric'
      ? metricsQueryKeys.metricsGetMetric(assetId)
      : dashboardQueryKeys.dashboardGetDashboard(assetId);

  const queryState = queryClient.getQueryState(options.queryKey);
  const queryData = queryClient.getQueryData(options.queryKey);
  const error = queryState?.error;

  if (!error) {
    return {
      has_access: true,
      password_required: false,
      public: false,
      queryData
    };
  }

  const status = error?.status;

  if (status === 418) {
    return {
      has_access: false,
      password_required: true,
      public: true,
      queryData
    };
  }

  return {
    has_access: false,
    password_required: false,
    public: false,
    queryData
  };
};
