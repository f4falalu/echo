import { createFileRoute } from '@tanstack/react-router';
import * as metricServerContext from '@/context/BusterAssets/metric-server/metricIndexServerAssetContext';

export const Route = createFileRoute(
  '/app/_app/_asset/collections/$collectionId/reports/$reportId/metrics/$metricId'
)({
  component: RouteComponent,
  ...metricServerContext,
});

function RouteComponent() {
  return (
    <div>
      Hello "/app/_app/_asset/collections/$collectionId/reports/$reportId/metrics/$metricId"!
    </div>
  );
}
