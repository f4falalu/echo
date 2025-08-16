import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const searchParamsSchema = z.object({
  dashboard_version_number: z.coerce.number().optional(),
});

export const Route = createFileRoute('/app/_app/chats/$chatId/dashboards/$dashboardId')({
  head: () => ({
    meta: [
      { title: 'Chat Dashboard' },
      { name: 'description', content: 'View dashboard within chat context' },
      { name: 'og:title', content: 'Chat Dashboard' },
      { name: 'og:description', content: 'View dashboard within chat context' },
    ],
  }),
  validateSearch: searchParamsSchema,
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/chats/$chatId/dashboard/$dashboardId"!</div>;
}
