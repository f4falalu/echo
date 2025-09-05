import { createFileRoute, Outlet } from '@tanstack/react-router';
import { prefetchAllPermissionGroups } from '@/api/buster_rest/permission_groups';

export const Route = createFileRoute('/app/_settings/_permissions/settings/permission-groups')({
  head: () => ({
    meta: [
      { title: 'Permission Groups' },
      { name: 'description', content: 'Configure user permission groups and access levels' },
      { name: 'og:title', content: 'Permission Groups' },
      { name: 'og:description', content: 'Configure user permission groups and access levels' },
    ],
  }),
  component: RouteComponent,
  loader: async ({ context }) => {
    const { queryClient } = context;
    await prefetchAllPermissionGroups(queryClient);
  },
});

function RouteComponent() {
  return <Outlet />;
}
