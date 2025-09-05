import { createFileRoute } from '@tanstack/react-router';
import { PermissionGroupUsersController } from '@/controllers/PermissionGroupsControllers/PermissionGroupUsersController';

export const Route = createFileRoute(
  '/app/_settings/_permissions/settings/permission-groups/$permissionGroupId/users'
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { permissionGroupId } = Route.useParams();
  return <PermissionGroupUsersController permissionGroupId={permissionGroupId} />;
}
