import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/app/_app/chats/$chatId/')({
  head: () => ({
    meta: [
      { title: 'Chat' },
      { name: 'description', content: 'View and interact with your chat conversation' },
      { name: 'og:title', content: 'Chat' },
      { name: 'og:description', content: 'View and interact with your chat conversation' },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/chats/$chatId/"!</div>;
}
