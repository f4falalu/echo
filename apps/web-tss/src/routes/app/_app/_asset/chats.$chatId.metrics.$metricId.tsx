import { createFileRoute } from '@tanstack/react-router';
import * as metricServerContext from '@/context/BusterAssets/metric-server/metricIndexServerAssetContext';

export const Route = createFileRoute('/app/_app/_asset/chats/$chatId/metrics/$metricId')({
  component: RouteComponent,
  ...metricServerContext,
});

function RouteComponent() {
  return <div>Hello "/app/chats/$chatId/metrics/$metricId"!</div>;
}
