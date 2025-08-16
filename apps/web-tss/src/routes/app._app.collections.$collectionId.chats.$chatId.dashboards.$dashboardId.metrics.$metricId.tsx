import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const searchParamsSchema = z.object({
  metric_version_number: z.coerce.number().optional(),
});

export const Route = createFileRoute(
  '/app/_app/collections/$collectionId/chats/$chatId/dashboards/$dashboardId/metrics/$metricId'
)({
  head: () => ({
    meta: [
      { title: 'Collection Chat Dashboard Metric' },
      { name: 'description', content: 'View metric within collection chat dashboard context' },
      { name: 'og:title', content: 'Collection Chat Dashboard Metric' },
      { name: 'og:description', content: 'View metric within collection chat dashboard context' },
    ],
  }),
  validateSearch: searchParamsSchema,
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      Hello
      "/app/collections/$collectionId/chats/$chatId/dashboards/$dashboardId/metrics/$metricId"!
    </div>
  );
}
