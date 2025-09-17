import { getRouteApi, type RouteContext, useParams, useSearch } from '@tanstack/react-router';

const assetRouteApi = getRouteApi('/app/_app/_asset');

const stableCtxSelector = (ctx: RouteContext) => ctx.assetType;
export const useSelectedAssetType = () => {
  const data = assetRouteApi.useRouteContext({ select: stableCtxSelector });
  const { messageId } = useParams({
    strict: false,
  });
  if (messageId || !data) {
    return 'reasoning';
  }
  return data;
};

export const useSelectedAssetId = () => {
  const assetType = useSelectedAssetType();
  const params = useParams({ strict: false });

  if (assetType === 'dashboard_file') {
    return params?.dashboardId;
  }

  if (assetType === 'report_file') {
    return params?.reportId;
  }

  if (assetType === 'collection') {
    return params?.collectionId;
  }

  if (assetType === 'metric_file') {
    return params?.metricId;
  }

  if (assetType === 'chat') {
    return params?.chatId;
  }

  if (assetType === 'reasoning') {
    return params?.messageId;
  }

  const _exhaustiveCheck: never = assetType;

  return null;
};

export const useGetSelectedAssetId = useSelectedAssetId;

export const useGetSelectedAssetVersionNumber = () => {
  const assetType = useSelectedAssetType();
  const params = useSearch({ strict: false });

  if (assetType === 'dashboard_file') {
    return params?.dashboard_version_number;
  }

  if (assetType === 'metric_file') {
    return params?.metric_version_number;
  }

  if (assetType === 'report_file') {
    return params?.report_version_number;
  }

  if (assetType === 'chat') {
    return;
  }

  if (assetType === 'reasoning') {
    return;
  }

  if (assetType === 'collection') {
    return;
  }

  const _exhaustiveCheck: never = assetType;

  return;
};
