import { createFileRoute } from '@tanstack/react-router';
import { prefetchDatasetGroupDatasets } from '@/api/buster_rest/dataset_groups';
import { DatasetGroupDatasetsController } from '@/controllers/DatasetGroupsControllers/DatasetIndividualControllers/DatasetGroupDatasetsController';

export const Route = createFileRoute(
  '/app/_settings/_permissions/settings/dataset-groups/$datasetGroupId/datasets'
)({
  component: RouteComponent,
  loader: async ({ context, params }) => {
    const { datasetGroupId } = params;
    const { queryClient } = context;
    await prefetchDatasetGroupDatasets(datasetGroupId, queryClient);
  },
});

function RouteComponent() {
  const { datasetGroupId } = Route.useParams();
  return <DatasetGroupDatasetsController datasetGroupId={datasetGroupId} />;
}
