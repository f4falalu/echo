import { createFileRoute } from '@tanstack/react-router';
import * as dashboardServerContext from '@/context/BusterAssets/dashboardServerAssetContext';

export const Route = createFileRoute('/app/_app/_asset/dashboards/$dashboardId/')({
  component: RouteComponent,
  ...dashboardServerContext,
});

function RouteComponent() {
  const { dashboardId } = Route.useParams();
  const { dashboard_version_number } = Route.useSearch();

  return (
    <div>
      <h1>Dashboard: {dashboardId}</h1>
      {dashboard_version_number && <p>Version Number: {dashboard_version_number}</p>}
    </div>
  );
}
