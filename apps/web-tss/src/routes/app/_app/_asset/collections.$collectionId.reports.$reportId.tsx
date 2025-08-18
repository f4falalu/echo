import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute(
  '/app/_app/_asset/collections/$collectionId/reports/$reportId'
)({
  component: RouteComponent,
  loader: async ({ params, context }) => {
    const title = await context.getAssetTitle({
      assetId: params.reportId,
      assetType: 'report',
    });
    return { title };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.title || 'Collection Report' },
      { name: 'description', content: 'View report within collection context' },
      { name: 'og:title', content: 'Collection Report' },
      { name: 'og:description', content: 'View report within collection context' },
    ],
  }),
});

function RouteComponent() {
  return <div>Hello "/app/_app/_asset/collections/$collectionId/reports/$reportId"!</div>;
}
