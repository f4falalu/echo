import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/app/_app/datasets/')({
  head: () => ({
    meta: [
      { title: 'Datasets' },
      { name: 'description', content: 'Explore and manage your datasets' },
      { name: 'og:title', content: 'Datasets' },
      { name: 'og:description', content: 'Explore and manage your datasets' },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/datasets"!</div>;
}
