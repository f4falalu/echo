import type { GetDashboardResponse } from '@buster/server-shared/dashboards';
import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import last from 'lodash/last';
import { dashboardQueryKeys } from '@/api/query_keys/dashboard';
import { metricsQueryKeys } from '@/api/query_keys/metric';
import { getProtectedAssetPassword } from '@/context/BusterAssets/useProtectedAssetStore';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { setOriginalDashboard } from '@/context/Dashboards/useOriginalDashboardStore';
import { setOriginalMetric } from '@/context/Metrics/useOriginalMetricStore';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { upgradeMetricToIMetric } from '@/lib/metrics/upgradeToIMetric';
import { prefetchGetMetricDataClient } from '../metrics/queryRequests';
import { getDashboardById } from './requests';

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
          dashboardQueryKeys.dashboardGetDashboard(res.dashboard.id, 'LATEST').queryKey,
          res
        );
        dashboardResponse = res;
      }
    }

    return dashboardResponse;
  });

  return method;
};

export const initializeMetrics = (
  metrics: GetDashboardResponse['metrics'],
  queryClient: QueryClient,
  prefetchData: boolean
) => {
  for (const metric of Object.values(metrics)) {
    const upgradedMetric = upgradeMetricToIMetric(metric, null);
    queryClient.setQueryData(
      metricsQueryKeys.metricsGetMetric(metric.id, metric.version_number).queryKey,
      upgradedMetric
    );
    const isLatestVersion = metric.version_number === last(metric.versions)?.version_number;
    if (isLatestVersion) {
      setOriginalMetric(upgradedMetric);
      queryClient.setQueryData(
        metricsQueryKeys.metricsGetMetric(metric.id, 'LATEST').queryKey,
        upgradedMetric
      );
    }
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
      return getDashboardAndInitializeMetrics({
        id,
        version_number,
        password,
        queryClient,
        shouldInitializeMetrics,
        prefetchMetricsData: prefetchData,
      });
    }
  );
};

//Can use this in server side
export const getDashboardAndInitializeMetrics = async ({
  id,
  version_number,
  password,
  queryClient,
  shouldInitializeMetrics = true,
  prefetchMetricsData = false,
}: {
  id: string;
  version_number: number | 'LATEST';
  password?: string;
  queryClient: QueryClient;
  shouldInitializeMetrics?: boolean;
  prefetchMetricsData?: boolean;
}) => {
  const chosenVersionNumber = version_number === 'LATEST' ? undefined : version_number;
  return getDashboardById({
    id: id || '',
    password,
    version_number: chosenVersionNumber,
  }).then((data) => {
    const latestVersion = last(data.versions)?.version_number || 1;
    const isLatestVersion = data.dashboard.version_number === latestVersion;
    if (isLatestVersion) {
      setOriginalDashboard(data.dashboard);
      queryClient.setQueryData(
        dashboardQueryKeys.dashboardGetDashboard(data.dashboard.id, 'LATEST').queryKey,
        data
      );
    }

    if (data.dashboard.version_number) {
      queryClient.setQueryData(
        dashboardQueryKeys.dashboardGetDashboard(data.dashboard.id, data.dashboard.version_number)
          .queryKey,
        data
      );
    }

    if (shouldInitializeMetrics || prefetchMetricsData) {
      initializeMetrics(data.metrics, queryClient, !!prefetchMetricsData);
    }

    return data;
  });
};
