import { createFileRoute } from '@tanstack/react-router';
import omit from 'lodash/omit';
import { prefetchGetMetric } from '@/api/buster_rest/metrics';
import * as metricServerContext from '@/context/BusterAssets/metric-server/metricLayoutServerAssetContext';

const metricEmbedContext = omit(metricServerContext, ['beforeLoad']);

export const Route = createFileRoute('/embed/metric/$metricId')({
  ...metricEmbedContext,
  component: RouteComponent,
  loader: async ({ params, context: { queryClient } }) => {
    const metric = await prefetchGetMetric(queryClient, { id: params.metricId });
    return {
      title: metric?.name,
    };
  },
  head: ({ loaderData }) => {
    return {
      meta: [{ title: loaderData?.title || 'Metric' }],
    };
  },
});

function RouteComponent() {
  return <div>Hello "/app/_embed/metric/$metricId"!</div>;
}
