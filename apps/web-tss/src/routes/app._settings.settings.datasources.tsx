import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/app/_settings/settings/datasources')({
  head: () => ({
    meta: [
      { title: 'Data Sources' },
      { name: 'description', content: 'Configure and manage your data sources' },
      { name: 'og:title', content: 'Data Sources' },
      { name: 'og:description', content: 'Configure and manage your data sources' },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/settings/datasources"!</div>;
}
