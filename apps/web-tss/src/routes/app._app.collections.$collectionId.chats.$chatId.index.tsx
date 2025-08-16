import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/app/_app/collections/$collectionId/chats/$chatId/')({
  loader: async ({ params, context }) => {
    const title = await context.getAssetTitle({
      assetId: params.chatId,
      assetType: 'chat',
    });
    return {
      title,
    };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.title || 'Collection Chat' },
      { name: 'description', content: 'Chat within collection context' },
      { name: 'og:title', content: 'Collection Chat' },
      { name: 'og:description', content: 'Chat within collection context' },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/collections/$collectionId/chats/$chatId"!</div>;
}
