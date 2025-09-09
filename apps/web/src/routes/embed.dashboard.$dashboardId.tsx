import { createFileRoute } from '@tanstack/react-router';
import { prefetchGetDashboard } from '@/api/buster_rest/dashboards';
import { DashboardViewDashboardController } from '@/controllers/DashboardController/DashboardViewDashboardController';

export const Route = createFileRoute('/embed/dashboard/$dashboardId')({
  loader: async ({ params, context: { queryClient } }) => {
    const dashboard = await prefetchGetDashboard({
      queryClient,
      id: params.dashboardId,
      prefetchMetricsData: false,
      shouldInitializeMetrics: true,
    });
    return {
      title: dashboard?.dashboard?.name,
    };
  },
  head: ({ loaderData }) => {
    return {
      meta: [
        { title: loaderData?.title || 'Dashboard' },
        { description: 'This is a dashboard that was created by the good folks at Buster.so' },
      ],
    };
  },
  component: RouteComponent,
  ssr: true,
});

function RouteComponent() {
  const { dashboardId } = Route.useParams();
  return <DashboardViewDashboardController dashboardId={dashboardId} readOnly />;
}
