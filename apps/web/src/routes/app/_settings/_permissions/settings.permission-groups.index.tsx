import { createFileRoute } from '@tanstack/react-router';
import { ListPermissionGroupsController } from '@/controllers/PermissionGroupsControllers/ListPermissionGroupsController';

export const Route = createFileRoute('/app/_settings/_permissions/settings/permission-groups/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <ListPermissionGroupsController />;
}
