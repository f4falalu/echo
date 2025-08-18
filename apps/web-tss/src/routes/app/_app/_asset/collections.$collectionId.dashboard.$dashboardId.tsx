import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const searchParamsSchema = z.object({
  dashboard_version_number: z.coerce.number().optional(),
});

export const Route = createFileRoute(
  '/app/_app/_asset/collections/$collectionId/dashboard/$dashboardId'
)({
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
      { title: loaderData?.title || 'Collection Dashboard' },
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
