import { createFileRoute } from '@tanstack/react-router';
import * as metricServerContext from '@/context/BusterAssets/metric-server/metricLayoutServerAssetContext';

export const Route = createFileRoute(
  '/app/_app/_asset/chats/$chatId/dashboards/$dashboardId/metrics/$metricId/chart'
)({
  ...metricServerContext,
});

function RouteComponent() {
  return <div>Hello "/app/chats/$chatId/dashboards/$dashboardId/metrics/$metricId"!</div>;
}
