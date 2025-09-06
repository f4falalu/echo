import { createFileRoute } from '@tanstack/react-router';
import { prefetchPermissionGroupDatasets } from '@/api/buster_rest/permission_groups';
import { PermissionGroupDatasetsController } from '@/controllers/PermissionGroupsControllers/PermissionGroupDatasetsController';

export const Route = createFileRoute(
  '/app/_settings/_permissions/settings/permission-groups/$permissionGroupId/datasets'
)({
  component: RouteComponent,
  loader: async ({ context, params }) => {
    const { permissionGroupId } = params;
    const { queryClient } = context;
    await prefetchPermissionGroupDatasets(permissionGroupId, queryClient);
  },
});

function RouteComponent() {
  const { permissionGroupId } = Route.useParams();
  return <PermissionGroupDatasetsController permissionGroupId={permissionGroupId} />;
}
