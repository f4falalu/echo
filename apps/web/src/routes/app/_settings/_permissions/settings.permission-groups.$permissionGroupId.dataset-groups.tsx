import { createFileRoute } from '@tanstack/react-router';
import { prefetchPermissionGroupDatasetGroups } from '@/api/buster_rest/permission_groups';
import { PermissionGroupDatasetGroupsController } from '@/controllers/PermissionGroupsControllers/PermissionGroupDatasetGroupsController';

export const Route = createFileRoute(
  '/app/_settings/_permissions/settings/permission-groups/$permissionGroupId/dataset-groups'
)({
  component: RouteComponent,
  loader: async ({ context, params }) => {
    const { permissionGroupId } = params;
    const { queryClient } = context;
    await prefetchPermissionGroupDatasetGroups(permissionGroupId, queryClient);
  },
});

function RouteComponent() {
  const { permissionGroupId } = Route.useParams();
  return <PermissionGroupDatasetGroupsController permissionGroupId={permissionGroupId} />;
}
