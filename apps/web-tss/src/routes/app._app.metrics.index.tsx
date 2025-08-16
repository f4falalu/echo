import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/app/_app/metrics/')({
  head: () => ({
    meta: [
      { title: 'Metrics' },
      { name: 'description', content: 'View and analyze your metrics' },
      { name: 'og:title', content: 'Metrics' },
      { name: 'og:description', content: 'View and analyze your metrics' },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/metrics"!</div>;
}
