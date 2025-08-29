import { createFileRoute } from '@tanstack/react-router';
import * as ServerEditChartAsset from '@/context/BusterAssets/metric-server/metricChartEditServerAssetContext';

export const Route = createFileRoute('/app/_app/_asset/metrics/$metricId/chart/edit')({
  ...ServerEditChartAsset,
});
