import { BusterRoutes } from '@/routes';
import { useMemoizedFn } from 'ahooks';
import { useAppLayoutContextSelector } from '../BusterAppLayout';

export const useDashboardMetrics = ({ openedDashboardId }: { openedDashboardId: string }) => {
  const onChangePage = useAppLayoutContextSelector((s) => s.onChangePage);

  const onDashboardOpenMetric = useMemoizedFn((metricId: string) => {
    onChangePage({
      route: BusterRoutes.APP_DASHBOARD_METRICS_ID,
      metricId: metricId,
      dashboardId: openedDashboardId
    });
  });

  return {
    onDashboardOpenMetric
  };
};
