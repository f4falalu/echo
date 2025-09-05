import { createFileRoute } from '@tanstack/react-router';
import { prefetchDatasetGroupPermissionGroups } from '@/api/buster_rest/dataset_groups';
import { DatasetGroupPermissionGroupsController } from '@/controllers/DatasetGroupsControllers/DatasetIndividualControllers/DatasetGroupsPermissionGroups';

export const Route = createFileRoute(
  '/app/_settings/_permissions/settings/dataset-groups/$datasetGroupId/permission-groups'
)({
  component: RouteComponent,
  loader: async ({ context, params }) => {
    const { datasetGroupId } = params;
    const { queryClient } = context;
    await prefetchDatasetGroupPermissionGroups(datasetGroupId, queryClient);
  },
});

function RouteComponent() {
  const { datasetGroupId } = Route.useParams();
  return <DatasetGroupPermissionGroupsController datasetGroupId={datasetGroupId} />;
}
