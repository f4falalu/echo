import { BusterDashboardResponse } from '@/api/asset_interfaces/dashboard';
import { IBusterMetric } from '@/api/asset_interfaces/metric';
import { queryKeys } from '@/api/query_keys';
import { dashboardQueryKeys } from '@/api/query_keys/dashboard';
import { metricsQueryKeys } from '@/api/query_keys/metric';
import { useBusterAssetsContextSelector } from '@/context/Assets/BusterAssetsProvider';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useOriginalDashboardStore } from '@/context/Dashboards';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { upgradeMetricToIMetric } from '@/lib/metrics/upgradeToIMetric';
import { useQueryClient } from '@tanstack/react-query';
import { prefetchGetMetricDataClient } from '../metrics/queryRequests';
import { dashboardsGetDashboard } from './requests';
import { useParams, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

export const useGetHighestVersionMetric = () => {
  const queryClient = useQueryClient();
  const method = useMemoizedFn((metricId: string) => {
    // Get all queries related to this metric
    const metricQueries = queryClient.getQueriesData<IBusterMetric>({
      queryKey: metricsQueryKeys.metricsGetMetric(metricId, undefined).queryKey.slice(0, -1)
    });

    // Find the metric with the highest version number

    let highestVersion = -1;

    for (const [queryKey, data] of metricQueries) {
      if (!data) continue;

      const versionNumber = data.version_number;
      if (versionNumber !== undefined && versionNumber > highestVersion) {
        highestVersion = versionNumber;
      }
    }

    return highestVersion === -1 ? undefined : highestVersion;
  });

  return method;
};

export const useEnsureDashboardConfig = (prefetchData: boolean = true) => {
  const queryClient = useQueryClient();
  const versionNumber = useGetDashboardVersionNumber();
  const prefetchDashboard = useGetDashboardAndInitializeMetrics(prefetchData);
  const { openErrorMessage } = useBusterNotifications();

  const method = useMemoizedFn(async (dashboardId: string) => {
    const options = dashboardQueryKeys.dashboardGetDashboard(dashboardId, versionNumber);
    let dashboardResponse = queryClient.getQueryData(options.queryKey);
    if (!dashboardResponse) {
      const res = await prefetchDashboard(dashboardId).catch((e) => {
        openErrorMessage('Failed to save metrics to dashboard. Dashboard not found');
        return null;
      });
      if (res) {
        queryClient.setQueryData(options.queryKey, res);
        dashboardResponse = res;
      }
    }

    return dashboardResponse;
  });

  return method;
};

export const useGetDashboardAndInitializeMetrics = (prefetchData: boolean = true) => {
  const queryClient = useQueryClient();
  const setOriginalDashboards = useOriginalDashboardStore((x) => x.setOriginalDashboard);
  const getAssetPassword = useBusterAssetsContextSelector((state) => state.getAssetPassword);

  const initializeMetrics = useMemoizedFn((metrics: BusterDashboardResponse['metrics']) => {
    for (const metric of Object.values(metrics)) {
      const prevMetric = queryClient.getQueryData(
        queryKeys.metricsGetMetric(metric.id, metric.version_number).queryKey
      );
      const upgradedMetric = upgradeMetricToIMetric(metric, prevMetric);
      queryClient.setQueryData(
        queryKeys.metricsGetMetric(metric.id, metric.version_number).queryKey,
        upgradedMetric
      );
      if (prefetchData) {
        prefetchGetMetricDataClient(
          { id: metric.id, version_number: metric.version_number },
          queryClient
        );
      }
    }
  });

  return useMemoizedFn(async (id: string, version_number?: number) => {
    const { password } = getAssetPassword?.(id) || {};

    return dashboardsGetDashboard({ id: id!, password, version_number }).then((data) => {
      initializeMetrics(data.metrics);
      setOriginalDashboards(data.dashboard);

      if (!version_number && data.dashboard.version_number) {
        queryClient.setQueryData(
          dashboardQueryKeys.dashboardGetDashboard(id, data.dashboard.version_number).queryKey,
          data
        );
      }

      return data;
    });
  });
};

export const useGetDashboardVersionNumber = (props?: {
  versionNumber?: number | null; //if null it will not use a params from the query params
}) => {
  const { versionNumber: versionNumberProp } = props || {};
  const { versionNumber: versionNumberPathParam, dashboardId: dashboardIdPathParam } =
    useParams() as {
      versionNumber: string | undefined;
      dashboardId: string | undefined;
    };
  const versionNumberQueryParam = useSearchParams().get('dashboard_version_number');
  const versionNumberFromParams = dashboardIdPathParam
    ? versionNumberQueryParam || versionNumberPathParam
    : undefined;

  const versionNumber = useMemo(() => {
    if (versionNumberProp === null) return undefined;
    return (
      versionNumberProp ??
      (versionNumberFromParams ? parseInt(versionNumberFromParams!) : undefined)
    );
  }, [versionNumberProp, versionNumberFromParams]);

  return versionNumber;
};
