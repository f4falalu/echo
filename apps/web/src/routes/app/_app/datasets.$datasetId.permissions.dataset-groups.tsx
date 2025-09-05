import { createFileRoute } from '@tanstack/react-router';
import { prefetchDatasetListDatasetGroups } from '@/api/buster_rest/datasets';
import { DatasetPermissionDatasetGroupController } from '@/controllers/DatasetsControllers/DatasetPermissions/DatasetPermissionDatasetGroupController';

export const Route = createFileRoute('/app/_app/datasets/$datasetId/permissions/dataset-groups')({
  component: RouteComponent,
  loader: async ({ params, context }) => {
    const { queryClient } = context;
    await prefetchDatasetListDatasetGroups(params.datasetId, queryClient);
  },
});

function RouteComponent() {
  const { datasetId } = Route.useParams();
  return <DatasetPermissionDatasetGroupController datasetId={datasetId} />;
}
