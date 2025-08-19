import { createFileRoute } from '@tanstack/react-router';
import * as metricServerContext from '@/context/BusterAssets/metricServerAssetContext';

export const Route = createFileRoute('/app/_app/_asset/metrics/$metricId')({
  component: RouteComponent,
  ...metricServerContext,
});

function RouteComponent() {
  return (
    <div className="flex flex-col gap-4">
      <div>Hello "/app/metrics/$metricId"! wow</div>
    </div>
  );
}
