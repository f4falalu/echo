import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const searchParamsSchema = z.object({
  dashboard_version_number: z.coerce.number().optional(),
  metric_version_number: z.coerce.number().optional(),
});

export const Route = createFileRoute(
  '/app/_app/_asset/chats/$chatId/dashboards/$dashboardId/metrics/$metricId'
)({
  loader: async ({ params, context }) => {
    const title = await context.getAssetTitle({
      assetId: params.metricId,
      assetType: 'metric',
    });
    return {
      title,
    };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.title || 'Chat Dashboard Metric' },
      { name: 'description', content: 'View metric within chat dashboard context' },
      { name: 'og:title', content: 'Chat Dashboard Metric' },
      { name: 'og:description', content: 'View metric within chat dashboard context' },
    ],
  }),
  validateSearch: searchParamsSchema,
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/chats/$chatId/dashboards/$dashboardId/metrics/$metricId"!</div>;
}
