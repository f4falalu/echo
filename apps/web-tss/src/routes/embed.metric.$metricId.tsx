import { createFileRoute } from '@tanstack/react-router';
import omit from 'lodash/omit';
import * as metricServerContext from '@/context/BusterAssets/metric-server/metricLayoutServerAssetContext';

const metricEmbedContext = omit(metricServerContext, ['beforeLoad']);

export const Route = createFileRoute('/embed/metric/$metricId')({
  ...metricEmbedContext,
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/_embed/metric/$metricId"!</div>;
}
