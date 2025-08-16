import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const searchParamsSchema = z.object({
  metric_version_number: z.coerce.number().optional(),
});

export const Route = createFileRoute(
  '/app/_app/collections/$collectionId/chats/$chatId/metrics/$metricId'
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
      { title: loaderData?.title || 'Collection Chat Metric' },
      { name: 'description', content: 'View metric within collection chat context' },
      { name: 'og:title', content: 'Collection Chat Metric' },
      { name: 'og:description', content: 'View metric within collection chat context' },
    ],
  }),
  validateSearch: searchParamsSchema,
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/collections/$collectionId/chats/$chatId/metrics/$metricId"!</div>;
}
