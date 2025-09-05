import { createFileRoute } from '@tanstack/react-router';
import { prefetchGetDatasource } from '@/api/buster_rest/data_source';
import { DataSourceIndividualController } from '@/controllers/DataSourceIndividualController';

export const Route = createFileRoute(
  '/app/_settings/_restricted_layout/_admin_only/settings/datasources/$datasourceId'
)({
  component: RouteComponent,
  loader: async ({ context, params }) => {
    const queryClient = context.queryClient;
    await prefetchGetDatasource(params.datasourceId, queryClient);
  },
});

function RouteComponent() {
  const { datasourceId } = Route.useParams();
  return <DataSourceIndividualController datasourceId={datasourceId} />;
}
