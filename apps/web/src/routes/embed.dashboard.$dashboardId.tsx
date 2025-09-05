import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { prefetchGetDashboard } from '@/api/buster_rest/dashboards';

const searchParamsSchema = z.object({
  dashboard_version_number: z.coerce.number().optional(),
});

export const Route = createFileRoute('/embed/dashboard/$dashboardId')({
  component: RouteComponent,
  validateSearch: searchParamsSchema,
  loader: async ({ params, context: { queryClient } }) => {
    const dashboard = await prefetchGetDashboard({
      queryClient,
      id: params.dashboardId,
      prefetchMetricsData: false,
    });
    return {
      title: dashboard?.dashboard?.name,
    };
  },
  head: ({ loaderData }) => {
    return {
      meta: [{ title: loaderData?.title || 'Dashboard' }],
    };
  },
});

function RouteComponent() {
  return <div>Hello "/app/_embed/dashboard/$dasboardId"!</div>;
}
