import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const searchParamsSchema = z.object({
  metric_version_number: z.coerce.number().optional(),
});

export const Route = createFileRoute('/app/_app/collections/$collectionId/metrics/$metricId')({
  head: () => ({
    meta: [
      { title: 'Collection Metric' },
      { name: 'description', content: 'View metric within collection context' },
      { name: 'og:title', content: 'Collection Metric' },
      { name: 'og:description', content: 'View metric within collection context' },
    ],
  }),
  validateSearch: searchParamsSchema,
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/collections/$collectionId/metrics/$metricId"!</div>;
}
