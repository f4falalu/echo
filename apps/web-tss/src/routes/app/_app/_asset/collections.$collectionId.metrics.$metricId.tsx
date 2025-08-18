import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const searchParamsSchema = z.object({
  metric_version_number: z.coerce.number().optional(),
});

export const Route = createFileRoute(
  '/app/_app/_asset/collections/$collectionId/metrics/$metricId'
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
  head: ({ loaderData }) => {
    return {
      meta: [
        { title: loaderData?.title || 'Collection Metric' },
        { name: 'description', content: 'View metric within collection context' },
        { name: 'og:title', content: 'Collection Metric' },
        { name: 'og:description', content: 'View metric within collection context' },
      ],
    };
  },
  validateSearch: searchParamsSchema,
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/collections/$collectionId/metrics/$metricId"!</div>;
}
