import { getRouteApi, type RouteContext, useParams } from '@tanstack/react-router';

const assetRouteApi = getRouteApi('/app/_app/_asset');

const stableCtxSelector = (ctx: RouteContext) => ctx.assetType;
export const useSelectedAssetType = () => {
  const data = assetRouteApi.useRouteContext({ select: stableCtxSelector });
  return data || 'metric';
};

export const useSelectedAssetId = () => {
  const assetType = useSelectedAssetType();
  const params = useParams({ strict: false });

  if (assetType === 'metric') {
    return params?.metricId;
  }

  if (assetType === 'dashboard') {
    return params?.dashboardId;
  }

  if (assetType === 'report') {
    return params?.reportId;
  }

  if (assetType === 'collection') {
    return params?.collectionId;
  }

  if (assetType === 'chat') {
    return params?.chatId;
  }

  const _exhaustiveCheck: never = assetType;

  return null;
};
