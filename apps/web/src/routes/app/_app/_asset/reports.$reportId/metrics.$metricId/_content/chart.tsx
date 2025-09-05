import { createFileRoute } from '@tanstack/react-router';
import * as metricChartServerAssetContext from '@/context/BusterAssets/metric-server/metricChartServerAssetContext';

export const Route = createFileRoute(
  '/app/_app/_asset/reports/$reportId/metrics/$metricId/_content/chart'
)({
  ...metricChartServerAssetContext,
});
