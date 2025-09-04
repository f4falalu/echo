import { createFileRoute } from '@tanstack/react-router';
import * as metricIndexServerContext from '@/context/BusterAssets/metric-server/metricIndexServerAssetContext';

export const Route = createFileRoute('/app/_app/_asset/reports/$reportId/metrics/$metricId/_content/')({
  ...metricIndexServerContext,
});
