import { createFileRoute } from '@tanstack/react-router';
import { prefetchDatasetListPermissionUsers } from '@/api/buster_rest/datasets';
import { DatasetPermissionUsersController } from '@/controllers/DatasetsControllers/DatasetPermissions/DataPermissionUsersController';

export const Route = createFileRoute('/app/_app/datasets/$datasetId/permissions/users')({
  component: RouteComponent,
  loader: async ({ params, context }) => {
    const { queryClient } = context;
    await prefetchDatasetListPermissionUsers(params.datasetId, queryClient);
  },
});

function RouteComponent() {
  const { datasetId } = Route.useParams();
  return <DatasetPermissionUsersController datasetId={datasetId} />;
}
