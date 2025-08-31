import { createFileRoute } from '@tanstack/react-router';
import * as dashboardIndexServerContext from '@/context/BusterAssets/dashboard-server/dashboardIndexContext';

export const Route = createFileRoute('/app/_app/_asset/dashboards/$dashboardId/')({
  ...dashboardIndexServerContext,
});
