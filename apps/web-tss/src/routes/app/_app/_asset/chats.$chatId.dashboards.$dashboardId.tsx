import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const searchParamsSchema = z.object({
  dashboard_version_number: z.coerce.number().optional(),
});

export const Route = createFileRoute('/app/_app/_asset/chats/$chatId/dashboards/$dashboardId')({
  staticData: {
    assetType: 'dashboard',
  },
  loader: async ({ params, context }) => {
    const title = await context.getAssetTitle({
      assetId: params.dashboardId,
      assetType: 'dashboard',
    });
    return {
      title,
    };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.title || 'Chat Dashboard' },
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
