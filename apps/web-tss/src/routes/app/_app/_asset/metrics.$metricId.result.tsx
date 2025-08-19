import { createFileRoute } from '@tanstack/react-router';
import * as metricChartServerAssetContext from '@/context/BusterAssets/metric-server/metricChartServerAssetContext';

export const Route = createFileRoute('/app/_app/_asset/metrics/$metricId/result')({
  ...metricChartServerAssetContext,
});
