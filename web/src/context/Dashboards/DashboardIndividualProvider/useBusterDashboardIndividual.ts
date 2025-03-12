import type { BusterDashboardResponse } from '@/api/asset_interfaces';
import { useBusterAssetsContextSelector } from '@/context/Assets/BusterAssetsProvider';
import { useMemoizedFn } from '@/hooks';
import { useBusterMetricsContextSelector } from '@/context/Metrics';
import { useGetDashboard } from '@/api/buster_rest/dashboards';

export const useBusterDashboardIndividual = ({
  dashboardId = ''
}: {
  dashboardId: string | undefined;
}) => {
  const onInitializeMetric = useBusterMetricsContextSelector((state) => state.onInitializeMetric);
  const getAssetPassword = useBusterAssetsContextSelector((state) => state.getAssetPassword);
  const { password } = getAssetPassword(dashboardId);

  const { data: dashboardResponse, refetch: refreshDashboard } = useGetDashboard(dashboardId);

  const initializeDashboardMetrics = useMemoizedFn(
    (metrics: BusterDashboardResponse['metrics']) => {
      for (const metric of metrics) {
        onInitializeMetric(metric);
      }
    }
  );

  const dashboard = dashboardResponse?.dashboard;
  const metrics = dashboardResponse?.metrics || [];

  return {
    dashboard,
    metrics,
    dashboardResponse,
    refreshDashboard
  };
};
