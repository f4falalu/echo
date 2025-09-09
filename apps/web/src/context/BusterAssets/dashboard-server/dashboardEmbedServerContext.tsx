import type { QueryClient } from '@tanstack/react-query';
import { prefetchGetDashboard } from '@/api/buster_rest/dashboards';
import { useGetDashboardParams } from '@/context/Dashboards/useGetDashboardParams';
import { DashboardViewDashboardController } from '@/controllers/DashboardController/DashboardViewDashboardController';

export const ssr = true;

export const component = () => {
  const { dashboardId } = useGetDashboardParams();
  return <DashboardViewDashboardController dashboardId={dashboardId} readOnly />;
};

export const head = ({ loaderData }: { loaderData?: { title: string | undefined } } = {}) => ({
  meta: [
    {
      title: loaderData?.title || 'Dashboard',
      description: 'This is a dashboard that was created by the good folks at Buster.so',
    },
  ],
});

export const loader = async ({
  params,
  context: { queryClient },
}: {
  params: { dashboardId: string };
  context: { queryClient: QueryClient };
}) => {
  const dashboard = await prefetchGetDashboard({
    queryClient,
    id: params.dashboardId,
    prefetchMetricsData: false,
    shouldInitializeMetrics: true,
  });
  return {
    title: dashboard?.dashboard?.name,
  };
};
