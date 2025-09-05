import { createFileRoute } from '@tanstack/react-router';
import { prefetchListDatasources } from '@/api/buster_rest/data_source';
import { SettingsPageHeader } from '@/components/features/settings';
import { DatasourceList } from '@/controllers/DataSourcesListController';

export const Route = createFileRoute(
  '/app/_settings/_restricted_layout/_admin_only/settings/datasources/'
)({
  component: RouteComponent,
  loader: async ({ context }) => {
    await prefetchListDatasources(context.queryClient);
  },
});

function RouteComponent() {
  return (
    <>
      <SettingsPageHeader
        title="Datasources"
        description={'Connect your database, data warehouse, DBT models, & more.'}
      />

      <DatasourceList />
    </>
  );
}
