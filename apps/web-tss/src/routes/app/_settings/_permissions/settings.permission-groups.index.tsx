import { createFileRoute } from '@tanstack/react-router';
import { prefetchAllPermissionGroups } from '@/api/buster_rest/permission_groups';
import { ListPermissionGroupsController } from '@/controllers/PermissionGroupsControllers/ListPermissionGroupsController';

export const Route = createFileRoute('/app/_settings/_permissions/settings/permission-groups/')({
  component: RouteComponent,
  loader: async ({ context }) => {
    const { queryClient } = context;
    await prefetchAllPermissionGroups(queryClient);
  },
});

function RouteComponent() {
  return <ListPermissionGroupsController />;
}
