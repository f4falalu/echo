import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/app/_app/datasets/$datasetId')({
  head: () => ({
    meta: [
      { title: 'Dataset' },
      { name: 'description', content: 'Explore and analyze your dataset' },
      { name: 'og:title', content: 'Dataset' },
      { name: 'og:description', content: 'Explore and analyze your dataset' },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/datasets/$datasetId"!</div>;
}
