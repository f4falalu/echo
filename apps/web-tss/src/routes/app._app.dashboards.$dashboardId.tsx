import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const searchParamsSchema = z.object({
  dashboard_version_number: z.coerce.number().optional(),
});

export const Route = createFileRoute('/app/_app/dashboards/$dashboardId')({
  validateSearch: searchParamsSchema,
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
