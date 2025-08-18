import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const searchParamsSchema = z.object({
  dashboard_version_number: z.coerce.number().optional(),
});

export const Route = createFileRoute(
  '/app/_app/_asset/collections/$collectionId/chats/$chatId/dashboards/$dashboardId'
)({
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
      { title: loaderData?.title || 'Collection Chat Dashboard' },
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
