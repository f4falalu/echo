import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const searchParamsSchema = z.object({
  metric_version_number: z.coerce.number().optional(),
});

export const Route = createFileRoute('/embed/metric/$metricId')({
  component: RouteComponent,
  validateSearch: searchParamsSchema,
});

function RouteComponent() {
  return <div>Hello "/app/_embed/metric/$metricId"!</div>;
}
