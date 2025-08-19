import type { AssetType } from '@buster/server-shared/assets';

export const getAssetIdAndVersionNumber = (
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
