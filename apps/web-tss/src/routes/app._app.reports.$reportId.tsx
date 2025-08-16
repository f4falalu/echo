import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const searchParamsSchema = z.object({
  report_version_number: z.coerce.number().optional(),
});

export const Route = createFileRoute('/app/_app/reports/$reportId')({
  head: () => ({
    meta: [
      { title: 'Report' },
      { name: 'description', content: 'View detailed report data and analysis' },
      { name: 'og:title', content: 'Report' },
      { name: 'og:description', content: 'View detailed report data and analysis' },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/reports/$reportId"!</div>;
}
