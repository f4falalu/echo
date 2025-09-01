import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import * as dashboardServerContext from '@/context/BusterAssets/dashboard-server/dashboardLayoutServerAssetContext';

const searchParamsSchema = z.object({
  dashboard_version_number: z.coerce.number().optional(),
});

export const Route = createFileRoute(
  '/app/_app/_asset/_dashboards/collections/$collectionId/dashboard/$dashboardId'
)({
  ...dashboardServerContext,
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/collections/$collectionId/dashboard/$dashboardId"!</div>;
}
