import { createFileRoute } from '@tanstack/react-router';
import { prefetchGetDatasetPermissionsOverview } from '@/api/buster_rest/datasets';
import { DatasetPermissionOverviewController } from '@/controllers/DatasetsControllers/DatasetPermissions/DatasetPermissionOverviewController';

export const Route = createFileRoute('/app/_app/datasets/$datasetId/permissions/overview')({
  component: RouteComponent,
  loader: async ({ params, context }) => {
    const { queryClient } = context;
    await prefetchGetDatasetPermissionsOverview(params.datasetId, queryClient);
  },
});

function RouteComponent() {
  const { datasetId } = Route.useParams();
  return <DatasetPermissionOverviewController datasetId={datasetId} />;
}
