import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const searchParamsSchema = z.object({
  metric_version_number: z.coerce.number().optional(),
});

export const Route = createFileRoute('/app/_app/collections/$collectionId/dashboard/$dashboardId/metrics/$metricId')({
  head: () => ({
    meta: [
      { title: 'Collection Dashboard Metric' },
      { name: 'description', content: 'View metric within collection dashboard context' },
      { name: 'og:title', content: 'Collection Dashboard Metric' },
      { name: 'og:description', content: 'View metric within collection dashboard context' },
    ],
  }),
  validateSearch: searchParamsSchema,
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/collections/$collectionId/dashboard/$dashboardId/metrics/$metricId"!</div>;
}
