import { createFileRoute } from '@tanstack/react-router';
import * as dashboardServerContext from '@/context/BusterAssets/dashboard-server/dashboardServerAssetContext';

export const Route = createFileRoute('/app/_app/_asset/dashboards/$dashboardId')({
  ...dashboardServerContext,
});
