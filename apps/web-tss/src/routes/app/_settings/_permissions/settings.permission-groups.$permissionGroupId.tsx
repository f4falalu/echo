import { createFileRoute, Outlet } from '@tanstack/react-router';
import { prefetchPermissionGroup } from '@/api/buster_rest/permission_groups';
import { PermissionGroupIndividualLayout } from '@/controllers/PermissionGroupsControllers/PermissionGroupsIndividualControllers/PermissionGroupIndividualLayout';

export const Route = createFileRoute(
  '/app/_settings/_permissions/settings/permission-groups/$permissionGroupId'
)({
  component: RouteComponent,
  loader: async ({ context, params }) => {
    const { permissionGroupId } = params;
    const { queryClient } = context;
    await prefetchPermissionGroup(permissionGroupId, queryClient);
  },
});

function RouteComponent() {
  const { permissionGroupId } = Route.useParams();
  return (
    <PermissionGroupIndividualLayout permissionGroupId={permissionGroupId}>
      <Outlet />
    </PermissionGroupIndividualLayout>
  );
}
