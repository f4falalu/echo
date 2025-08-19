import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const searchParamsSchema = z.object({
  dashboard_version_number: z.coerce.number().optional(),
});

export const Route = createFileRoute('/embed/dashboard/$dashboardId')({
  component: RouteComponent,
  validateSearch: searchParamsSchema,
});

function RouteComponent() {
  return <div>Hello "/app/_embed/dashboard/$dasboardId"!</div>;
}
