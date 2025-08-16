import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const searchParamsSchema = z.object({
  dashboard_version_number: z.coerce.number().optional(),
});

export const Route = createFileRoute(
  '/app/_app/collections/$collectionId/chats/$chatId/dashboards/$dashboardId'
)({
  head: () => ({
    meta: [
      { title: 'Collection Chat Dashboard' },
      { name: 'description', content: 'View dashboard within collection chat context' },
      { name: 'og:title', content: 'Collection Chat Dashboard' },
      { name: 'og:description', content: 'View dashboard within collection chat context' },
    ],
  }),
  validateSearch: searchParamsSchema,
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/collections/$collectionId/chats/$chatId/dashboards/$dashboardId"!</div>;
}
