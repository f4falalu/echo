import { BusterDashboardResponse, queryKeys } from '@/api/asset_interfaces';
import { useBusterAssetsContextSelector } from '@/context/Assets/BusterAssetsProvider';
import { useMemoizedFn } from 'ahooks';
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

  const { data: dashboardResponse, refetch: refreshDashboard } = useSocketQueryEmitOn(
    { route: '/dashboards/get', payload: { id: dashboardId, password } },
    '/dashboards/get:getDashboardState',
    queryKeys['/dashboards/get:getDashboardState'](dashboardId || ''),
    (currentData, newData) => {
      initializeDashboardMetrics(newData.metrics);
      return newData;
    },
    !!dashboardId
  );

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
