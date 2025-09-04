import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/app/_settings/_permissions/settings/dataset-groups')({
  head: () => ({
    meta: [
      { title: 'Dataset Groups' },
      { name: 'description', content: 'Organize datasets into groups and categories' },
      { name: 'og:title', content: 'Dataset Groups' },
      { name: 'og:description', content: 'Organize datasets into groups and categories' },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
