import { createFileRoute } from '@tanstack/react-router';
import { prefetchDatasetListPermissionGroups } from '@/api/buster_rest/datasets';
import { DatasetPermissionPermissionGroupController } from '@/controllers/DatasetsControllers/DatasetPermissions/DatasetPermissionPermissionGroupController';

export const Route = createFileRoute('/app/_app/datasets/$datasetId/permissions/permission-groups')(
  {
    component: RouteComponent,
    loader: async ({ params, context }) => {
      const { queryClient } = context;
      await prefetchDatasetListPermissionGroups(params.datasetId, queryClient);
    },
  }
);

function RouteComponent() {
  const { datasetId } = Route.useParams();
  return <DatasetPermissionPermissionGroupController datasetId={datasetId} />;
}
