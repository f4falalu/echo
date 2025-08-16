import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/app/_app/collections/')({
  head: () => ({
    meta: [
      { title: 'Collections' },
      { name: 'description', content: 'Browse and organize your collections' },
      { name: 'og:title', content: 'Collections' },
      { name: 'og:description', content: 'Browse and organize your collections' },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/collections"!</div>;
}
