import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import last from 'lodash/last';
import type { BusterDashboardResponse } from '@/api/asset_interfaces/dashboard';
import { dashboardQueryKeys } from '@/api/query_keys/dashboard';
import { metricsQueryKeys } from '@/api/query_keys/metric';
import { getProtectedAssetPassword } from '@/context/BusterAssets/useProtectedAssetStore';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { setOriginalDashboard } from '@/context/Dashboards/useOriginalDashboardStore';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { upgradeMetricToIMetric } from '@/lib/metrics/upgradeToIMetric';
import { prefetchGetMetricDataClient } from '../metrics/queryRequests';
import { dashboardsGetDashboard } from './requests';

export const useEnsureDashboardConfig = (params?: { prefetchData?: boolean }) => {
  const { prefetchData = true } = params || {};
  const queryClient = useQueryClient();
  const prefetchDashboard = useGetDashboardAndInitializeMetrics({
    prefetchData,
  });
  const { openErrorMessage } = useBusterNotifications();

  const method = useMemoizedFn(async (dashboardId: string, initializeMetrics = true) => {
    const options = dashboardQueryKeys.dashboardGetDashboard(dashboardId, 'LATEST');
    let dashboardResponse = queryClient.getQueryData(options.queryKey);
    if (!dashboardResponse) {
      const res = await prefetchDashboard(dashboardId, 'LATEST', initializeMetrics).catch(() => {
        openErrorMessage('Failed to save metrics to dashboard. Dashboard not found');
      });
      if (res) {
        queryClient.setQueryData(
          dashboardQueryKeys.dashboardGetDashboard(res.dashboard.id, res.dashboard.version_number)
            .queryKey,
          res
        );
        dashboardResponse = res;
      }
    }

    return dashboardResponse;
  });

  return method;
};

const initializeMetrics = (
  metrics: BusterDashboardResponse['metrics'],
  queryClient: QueryClient,
  prefetchData: boolean
) => {
  for (const metric of Object.values(metrics)) {
    const prevMetric = queryClient.getQueryData(
      metricsQueryKeys.metricsGetMetric(metric.id, metric.version_number).queryKey
    );
    const upgradedMetric = upgradeMetricToIMetric(metric, prevMetric);

    queryClient.setQueryData(
      metricsQueryKeys.metricsGetMetric(metric.id, metric.version_number).queryKey,
      upgradedMetric
    );
    if (prefetchData) {
      prefetchGetMetricDataClient(
        { id: metric.id, version_number: metric.version_number },
        queryClient
      );
    }
  }
};

export const useGetDashboardAndInitializeMetrics = (params?: { prefetchData?: boolean }) => {
  const { prefetchData = true } = params || {};
  const queryClient = useQueryClient();

  return useMemoizedFn(
    async (id: string, version_number: number | 'LATEST', shouldInitializeMetrics = true) => {
      const password = getProtectedAssetPassword?.(id);

      const chosenVersionNumber: number | undefined =
        version_number === 'LATEST' ? undefined : version_number;

      return dashboardsGetDashboard({
        id: id || '',
        password,
        version_number: chosenVersionNumber,
      }).then((data) => {
        const latestVersion = last(data.versions)?.version_number || 1;
        const isLatestVersion = data.dashboard.version_number === latestVersion;

        if (isLatestVersion) {
          setOriginalDashboard(data.dashboard);
        }

        if (data.dashboard.version_number) {
          queryClient.setQueryData(
            dashboardQueryKeys.dashboardGetDashboard(
              data.dashboard.id,
              data.dashboard.version_number
            ).queryKey,
            data
          );
        }

        if (shouldInitializeMetrics) initializeMetrics(data.metrics, queryClient, prefetchData);

        return data;
      });
    }
  );
};
