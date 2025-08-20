import type { AssetType } from '@buster/server-shared/assets';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/app/_app/_asset/chats/$chatId')({
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
      { title: loaderData?.title || 'Chat' },
      { name: 'description', content: 'View and interact with your chat conversation' },
      { name: 'og:title', content: 'Chat' },
      { name: 'og:description', content: 'View and interact with your chat conversation' },
    ],
  }),
  component: RouteComponent,
  staticData: {
    assetType: 'chat' as Extract<AssetType, 'chat'>,
  },
});

function RouteComponent() {
  return <div>Hello "/app/chats/$chatId/"!</div>;
}
