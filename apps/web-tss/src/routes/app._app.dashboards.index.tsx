import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/app/_app/dashboards/')({
  head: () => ({
    meta: [
      { title: 'Dashboards' },
      { name: 'description', content: 'View and manage your data dashboards' },
      { name: 'og:title', content: 'Dashboards' },
      { name: 'og:description', content: 'View and manage your data dashboards' },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/dashboads"!</div>;
}
