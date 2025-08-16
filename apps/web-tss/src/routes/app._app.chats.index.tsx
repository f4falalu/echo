import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/app/_app/chats/')({
  head: () => ({
    meta: [
      { title: 'Chats' },
      { name: 'description', content: 'Browse and manage your chat conversations' },
      { name: 'og:title', content: 'Chats' },
      { name: 'og:description', content: 'Browse and manage your chat conversations' },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/chats"!</div>;
}
