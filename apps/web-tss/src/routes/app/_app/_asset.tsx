import { type AssetType, AssetTypeSchema } from '@buster/server-shared/assets';
import { createFileRoute, Outlet } from '@tanstack/react-router';
import { getTitle as getAssetTitle } from '@/api/buster_rest/title';
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

    const params = lastMatch.params;

    console.log(params);

    return {
      assetType: assetType as AssetType,
    };
  },
  loader: ({ context }) => {
    return {
      assetType: context.assetType,
    };
  },
});

function RouteComponent() {
  const { assetType } = Route.useLoaderData();

  return (
    // <AppAssetCheckLayout type={assetType}>
    <Outlet />
    // </AppAssetCheckLayout>
  );
}

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
