import type { BusterDashboardResponse } from '@/api/asset_interfaces';
import { queryKeys } from '@/api/query_keys';
import { useBusterAssetsContextSelector } from '@/context/Assets/BusterAssetsProvider';
import { useMemoizedFn } from '@/hooks';
import { useBusterMetricsIndividualContextSelector } from '@/context/Metrics';
import { useSocketQueryEmitOn } from '@/api/buster_socket_query';

export const useBusterDashboardIndividual = ({
  dashboardId = ''
}: {
  dashboardId: string | undefined;
}) => {
  const onInitializeMetric = useBusterMetricsIndividualContextSelector(
    (state) => state.onInitializeMetric
  );
  const getAssetPassword = useBusterAssetsContextSelector((state) => state.getAssetPassword);
  const { password } = getAssetPassword(dashboardId);

  const { data: dashboardResponse, refetch: refreshDashboard } = useSocketQueryEmitOn({
    emitEvent: {
      route: '/dashboards/get',
      payload: { id: dashboardId, password }
    },
    responseEvent: '/dashboards/get:getDashboardState',
    options: queryKeys.dashboardGetDashboard(dashboardId || ''),
    callback: (_, newData) => {
      initializeDashboardMetrics(newData.metrics);
      return newData;
    },
    enabledTrigger: !!dashboardId
  });

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
