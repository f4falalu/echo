import { createFileRoute } from '@tanstack/react-router';
import * as dashboardContentServerContext from '@/context/BusterAssets/dashboard-server/dashboardContentContext';

export const Route = createFileRoute(
  '/app/_app/_asset/_dashboards/dashboards/$dashboardId/content'
)({
  ...dashboardContentServerContext,
});
