import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const searchParamsSchema = z.object({
  metric_version_number: z.coerce.number().optional(),
});

export const Route = createFileRoute('/app/_app/metrics/$metricId')({
  head: () => ({
    meta: [
      { title: 'Metric' },
      { name: 'description', content: 'View detailed metric analysis and insights' },
      { name: 'og:title', content: 'Metric' },
      { name: 'og:description', content: 'View detailed metric analysis and insights' },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/metrics/$metricId"!</div>;
}
