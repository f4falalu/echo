import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const searchParamsSchema = z.object({
  report_version_number: z.coerce.number().optional(),
});

export const Route = createFileRoute('/embed/report/$reportId')({
  component: RouteComponent,
  validateSearch: searchParamsSchema,
});

function RouteComponent() {
  return <div>Hello "/embed/report/$reportId"!</div>;
}
