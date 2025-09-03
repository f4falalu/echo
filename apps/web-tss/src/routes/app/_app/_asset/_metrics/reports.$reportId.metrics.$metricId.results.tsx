import { createFileRoute } from '@tanstack/react-router';
import * as metricResultsServerAssetContext from '@/context/BusterAssets/metric-server/metricResultsServerAssetContext';

export const Route = createFileRoute(
  '/app/_app/_asset/_metrics/reports/$reportId/metrics/$metricId/results'
)({
  ...metricResultsServerAssetContext,
});
