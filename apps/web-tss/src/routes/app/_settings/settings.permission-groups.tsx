import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/app/_settings/settings/permission-groups')({
  head: () => ({
    meta: [
      { title: 'Permission Groups' },
      { name: 'description', content: 'Configure user permission groups and access levels' },
      { name: 'og:title', content: 'Permission Groups' },
      { name: 'og:description', content: 'Configure user permission groups and access levels' },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/settings/permission-groups"!</div>;
}
