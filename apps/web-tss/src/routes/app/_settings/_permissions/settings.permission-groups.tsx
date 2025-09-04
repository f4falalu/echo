import { createFileRoute } from '@tanstack/react-router';
import { ListPermissionGroupsController } from '@/controllers/PermissionGroupsControllers/ListPermissionGroupsController';

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
});

function RouteComponent() {
  return <div>TODO</div>;
}
