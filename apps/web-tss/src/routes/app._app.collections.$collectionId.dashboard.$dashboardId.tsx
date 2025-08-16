import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const searchParamsSchema = z.object({
  dashboard_version_number: z.coerce.number().optional(),
});

export const Route = createFileRoute('/app/_app/collections/$collectionId/dashboard/$dashboardId')({
  head: () => ({
    meta: [
      { title: 'Collection Dashboard' },
      { name: 'description', content: 'View dashboard within collection context' },
      { name: 'og:title', content: 'Collection Dashboard' },
      { name: 'og:description', content: 'View dashboard within collection context' },
    ],
  }),
  validateSearch: searchParamsSchema,
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/collections/$collectionId/dashboard/$dashboardId"!</div>;
}
