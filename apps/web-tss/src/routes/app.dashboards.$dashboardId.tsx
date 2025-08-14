import { createFileRoute } from '@tanstack/react-router';

// Search params interface for type safety
interface DashboardSearch {
  dashboard_version_number?: number;
}

export const Route = createFileRoute('/app/dashboards/$dashboardId')({
  validateSearch: (search: Record<string, unknown>): DashboardSearch => ({
    dashboard_version_number: search.dashboard_version_number
      ? Number(search.dashboard_version_number)
      : undefined,
  }),
  component: RouteComponent,
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
