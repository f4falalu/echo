import { createFileRoute } from '@tanstack/react-router';
import { prefetchDatasetGroupUsers } from '@/api/buster_rest/dataset_groups';
import { DatasetGroupUsersController } from '@/controllers/DatasetGroupsControllers/DatasetIndividualControllers/DatasetGroupsUsersController';

export const Route = createFileRoute(
  '/app/_settings/_permissions/settings/dataset-groups/$datasetGroupId/users'
)({
  component: RouteComponent,
  loader: async ({ context, params }) => {
    const { datasetGroupId } = params;
    const { queryClient } = context;
    await prefetchDatasetGroupUsers(datasetGroupId, queryClient);
  },
});

function RouteComponent() {
  const { datasetGroupId } = Route.useParams();
  return <DatasetGroupUsersController datasetGroupId={datasetGroupId} />;
}
