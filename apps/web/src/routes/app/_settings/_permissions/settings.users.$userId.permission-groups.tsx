import { createFileRoute } from '@tanstack/react-router';
import { prefetchGetUserPermissionGroups } from '@/api/buster_rest/users';
import { UserPermissionGroupsController } from '@/controllers/PermissionGroupsControllers/UserPermissionGroupsController';

export const Route = createFileRoute(
  '/app/_settings/_permissions/settings/users/$userId/permission-groups'
)({
  component: RouteComponent,
  loader: async ({ context, params }) => {
    const { userId } = params;
    const { queryClient } = context;
    await prefetchGetUserPermissionGroups(userId, queryClient);
  },
});

function RouteComponent() {
  const { userId } = Route.useParams();
  return <UserPermissionGroupsController userId={userId} />;
}
