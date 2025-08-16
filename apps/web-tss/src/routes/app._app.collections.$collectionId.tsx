import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/app/_app/collections/$collectionId')({
  head: () => ({
    meta: [
      { title: 'Collection' },
      { name: 'description', content: 'View and manage your collection items' },
      { name: 'og:title', content: 'Collection' },
      { name: 'og:description', content: 'View and manage your collection items' },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/collections/$collectionId"!</div>;
}
