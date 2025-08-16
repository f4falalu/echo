import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const searchParamsSchema = z.object({
  metric_version_number: z.coerce.number().optional(),
});

export const Route = createFileRoute('/app/_app/chats/$chatId/metrics/$metricId')({
  head: () => ({
    meta: [
      { title: 'Chat Metric' },
      { name: 'description', content: 'View metric within chat context' },
      { name: 'og:title', content: 'Chat Metric' },
      { name: 'og:description', content: 'View metric within chat context' },
    ],
  }),
  validateSearch: searchParamsSchema,
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/chats/$chatId/metrics/$metricId"!</div>;
}
