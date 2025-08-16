import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/app/_app/collections/$collectionId/chats/$chatId')({
  head: () => ({
    meta: [
      { title: 'Collection Chat' },
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
