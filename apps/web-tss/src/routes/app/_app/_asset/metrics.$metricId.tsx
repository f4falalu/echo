import { createFileRoute } from '@tanstack/react-router';
import * as metricLayoutServerContext from '@/context/BusterAssets/metric-server/metricLayoutServerAssetContext';

export const Route = createFileRoute('/app/_app/_asset/metrics/$metricId')({
  ...metricLayoutServerContext,
});
