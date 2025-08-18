import { type AssetType, AssetTypeSchema } from '@buster/server-shared/assets';
import { createFileRoute, Outlet } from '@tanstack/react-router';
import { useMemo } from 'react';
import { z } from 'zod';
import { getTitle as getAssetTitle } from '@/api/buster_rest/title';
import { AppAssetCheckLayout, type AppAssetCheckLayoutProps } from '@/layouts/AppAssetCheckLayout';
import type { FileRouteTypes } from '@/routeTree.gen';

export const Route = createFileRoute('/app/_app/_asset')({
  component: RouteComponent,
  context: () => ({
    getAssetTitle,
  }),
  beforeLoad: async ({ matches }) => {
    const lastMatch = matches[matches.length - 1];
    const assetType = ([...matches].reverse().find(({ staticData }) => staticData?.assetType)
      ?.staticData?.assetType ||
      //fallback to the last match if no static data is found
      routeIdToAssetType[lastMatch.fullPath as FileRouteTypes['to']]) as AssetType;
    if (!assetType) {
      console.error('No asset type found for route', matches[matches.length - 1].routeId);
      throw new Error('No asset type found');
    }
    const isCorrectAssetType = AssetTypeSchema.safeParse(assetType).success;
    if (!isCorrectAssetType) {
      console.error('Invalid asset type for route', matches[matches.length - 1].routeId, assetType);
      throw new Error('Invalid asset type');
    }
    return {
      assetType: assetType as AssetType,
    };
  },
  validateSearch: z.object({
    metric_version_number: z.coerce.number().optional(),
    dashboard_version_number: z.coerce.number().optional(),
    report_version_number: z.coerce.number().optional(),
  }),
  loaderDeps: ({ search }) => {
    return search;
  },
  loader: ({ params, deps, context }) => {
    const assetType = context.assetType;
    //  const test = context.assetType as AssetType;
    // const assetType = 'metric' as const;
    const { assetId, versionNumber } = getAssetId(assetType as AssetType, params, deps);
    return {
      assetType,
      assetId,
      versionNumber,
    };
  },
});

function RouteComponent() {
  const { assetType, versionNumber, assetId } = Route.useLoaderData();

  const containerParams: AppAssetCheckLayoutProps = {
    assetId,
    type: assetType,
    versionNumber,
  };

  return (
    <AppAssetCheckLayout {...containerParams}>
      <Outlet />
    </AppAssetCheckLayout>
  );
}

const getAssetId = (
  assetType: AssetType,
  params: {
    chatId?: string;
    dashboardId?: string;
    metricId?: string;
    reportId?: string;
    collectionId?: string;
  },
  search: {
    metric_version_number?: number;
    dashboard_version_number?: number;
    report_version_number?: number;
  }
) => {
  if (assetType === 'chat') {
    return { assetId: params.chatId ?? '', versionNumber: undefined };
  }
  if (assetType === 'dashboard') {
    return { assetId: params.dashboardId ?? '', versionNumber: search.dashboard_version_number };
  }
  if (assetType === 'metric') {
    return { assetId: params.metricId ?? '', versionNumber: search.metric_version_number };
  }
  if (assetType === 'report') {
    return { assetId: params.reportId ?? '', versionNumber: search.report_version_number };
  }
  if (assetType === 'collection') {
    return { assetId: params.collectionId ?? '', versionNumber: undefined };
  }
  const _exhaustiveCheck: never = assetType;
  return { assetId: '', versionNumber: undefined };
};

const routeIdToAssetType: Partial<Record<FileRouteTypes['to'], AssetType>> = {
  '/app/chats/$chatId': 'chat',
  '/app/chats/$chatId/dashboards/$dashboardId': 'dashboard',
  '/app/chats/$chatId/metrics/$metricId': 'metric',
  '/app/chats/$chatId/report/$reportId': 'report',
  '/app/collections/$collectionId': 'collection',
  '/app/collections/$collectionId/chats/$chatId': 'chat',
  '/app/collections/$collectionId/dashboard/$dashboardId': 'dashboard',
  '/app/collections/$collectionId/metrics/$metricId': 'metric',
  '/app/collections/$collectionId/reports/$reportId': 'report',
  '/app/collections/$collectionId/reports/$reportId/metrics/$metricId': 'metric',
  '/app/dashboards/$dashboardId': 'dashboard',
  '/app/dashboards/$dashboardId/metrics/$metricId': 'metric',
  '/app/metrics/$metricId': 'metric',
  '/app/reports/$reportId': 'report',
};

declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    assetType?: AssetType;
  }
}
