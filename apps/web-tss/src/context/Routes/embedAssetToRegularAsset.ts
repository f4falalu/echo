import type { LinkProps, MakeRouteMatchUnion } from '@tanstack/react-router';

export const embedAssetToRegularAsset = (matches: MakeRouteMatchUnion[]) => {
  const lastMatch = matches[matches.length - 1];
  const staticData = lastMatch.staticData;
  const assetType = staticData?.assetType;

  if (assetType === 'metric') {
    const params = lastMatch.params as { metricId: string };
    const search = lastMatch.search as { metric_version_number?: number | undefined };
    return {
      to: '/embed/metric/$metricId',
      params: {
        metricId: params.metricId,
      },
      search: {
        metric_version_number: search.metric_version_number,
      },
    } as const satisfies LinkProps;
  }

  if (assetType === 'dashboard') {
    const params = lastMatch.params as { dashboardId: string };
    return {
      to: '/embed/dashboard/$dashboardId',
      params: {
        dashboardId: params.dashboardId,
      },
    } as const satisfies LinkProps;
  }

  if (assetType === 'report') {
    const params = lastMatch.params as { reportId: string };
    return {
      to: '/embed/report/$reportId',
      params: {
        reportId: params.reportId,
      },
    } as const satisfies LinkProps;
  }

  return {
    to: '/auth/login',
  } as const satisfies LinkProps;
};
