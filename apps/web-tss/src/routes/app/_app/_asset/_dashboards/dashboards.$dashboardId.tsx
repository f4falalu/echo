import { createFileRoute } from '@tanstack/react-router';
import * as dashboardLayoutServerAssetContext from '@/context/BusterAssets/dashboard-server/dashboardLayoutServerAssetContext';

export const Route = createFileRoute('/app/_app/_asset/_dashboards/dashboards/$dashboardId')({
  ...dashboardLayoutServerAssetContext,
});
