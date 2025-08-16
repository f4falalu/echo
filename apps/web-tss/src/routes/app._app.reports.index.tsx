import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/app/_app/reports/')({
  head: () => ({
    meta: [
      { title: 'Reports' },
      { name: 'description', content: 'Generate and view your reports' },
      { name: 'og:title', content: 'Reports' },
      { name: 'og:description', content: 'Generate and view your reports' },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/reports"!</div>;
}
