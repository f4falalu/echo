import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/app/_settings/_permissions/settings/users')({
  head: () => ({
    meta: [
      { title: 'User Management' },
      { name: 'description', content: 'Manage users and their permissions' },
      { name: 'og:title', content: 'User Management' },
      { name: 'og:description', content: 'Manage users and their permissions' },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
