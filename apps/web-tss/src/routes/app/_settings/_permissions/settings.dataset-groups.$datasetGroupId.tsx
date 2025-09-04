import { createFileRoute, Outlet } from '@tanstack/react-router';
import { prefetchDatasetGroup } from '@/api/buster_rest/dataset_groups';
import { DatasetGroupsIndividualLayout } from '@/controllers/DatasetGroupsControllers/DatasetIndividualControllers/DatasetIndividualLayout';

export const Route = createFileRoute(
  '/app/_settings/_permissions/settings/dataset-groups/$datasetGroupId'
)({
  component: RouteComponent,
  loader: async ({ context, params }) => {
    const { datasetGroupId } = params;
    const { queryClient } = context;
    await prefetchDatasetGroup(datasetGroupId, queryClient);
  },
});

function RouteComponent() {
  const { datasetGroupId } = Route.useParams();
  return (
    <DatasetGroupsIndividualLayout datasetGroupId={datasetGroupId}>
      <Outlet />
    </DatasetGroupsIndividualLayout>
  );
}
