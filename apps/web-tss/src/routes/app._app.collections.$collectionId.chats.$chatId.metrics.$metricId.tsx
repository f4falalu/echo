import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const searchParamsSchema = z.object({
  metric_version_number: z.coerce.number().optional(),
});

export const Route = createFileRoute(
  '/app/_app/collections/$collectionId/chats/$chatId/metrics/$metricId'
)({
  head: () => ({
    meta: [
      { title: 'Collection Chat Metric' },
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
