import { createFileRoute } from '@tanstack/react-router';
import * as metricChartServerAssetContext from '@/context/BusterAssets/metric-server/metricChartServerAssetContext';

export const Route = createFileRoute(
  '/app/_app/_asset/dashboards/$dashboardId/metrics/$metricId/_content/chart'
)({
  ...metricChartServerAssetContext,
});
