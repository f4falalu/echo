import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const searchParamsSchema = z.object({
  metric_version_number: z.coerce.number().optional(),
  dashboard_version_number: z.coerce.number().optional(),
});

export const Route = createFileRoute(
  '/app/_app/_asset/collections/$collectionId/dashboard/$dashboardId/metrics/$metricId'
)({
  staticData: {
    assetType: 'metric',
  },
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
      { title: loaderData?.title || 'Collection Dashboard Metric' },
      { name: 'description', content: 'View metric within collection dashboard context' },
      { name: 'og:title', content: 'Collection Dashboard Metric' },
      { name: 'og:description', content: 'View metric within collection dashboard context' },
    ],
  }),
  validateSearch: searchParamsSchema,
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>Hello "/app/collections/$collectionId/dashboard/$dashboardId/metrics/$metricId"!</div>
  );
}
