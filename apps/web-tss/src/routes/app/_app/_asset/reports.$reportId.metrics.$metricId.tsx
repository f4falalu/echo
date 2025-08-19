import { createFileRoute } from '@tanstack/react-router';
import * as metricServerContext from '@/context/BusterAssets/metric-server/metricIndexServerAssetContext';

export const Route = createFileRoute('/app/_app/_asset/reports/$reportId/metrics/$metricId')({
  component: RouteComponent,
  ...metricServerContext,
});

function RouteComponent() {
  return <div>Hello "/app/_app/reports/$reportId/metrics/$metricId"!</div>;
}
