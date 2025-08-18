import type { AssetType } from '@buster/server-shared/assets';
import { createFileRoute, Link } from '@tanstack/react-router';
import { z } from 'zod';
import { prefetchGetMetric } from '@/api/buster_rest/metrics/getMetricQueryRequests';

const searchParamsSchema = z.object({
  metric_version_number: z.coerce.number().optional(),
});

export const Route = createFileRoute('/app/_app/_asset/metrics/$metricId')({
  loader: async ({ params, context }) => {
    const title = await context.getAssetTitle({
      assetId: params.metricId,
      assetType: 'metric',
    });
    await prefetchGetMetric({ id: params.metricId, version_number: 1 }, context.queryClient);
    return {
      title,
    };
  },
  staticData: {
    assetType: 'metric' as Extract<AssetType, 'metric'>,
  },
  validateSearch: searchParamsSchema,
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.title || 'Metric' },
      { name: 'description', content: 'View detailed metric analysis and insights' },
      { name: 'og:title', content: 'Metric' },
      { name: 'og:description', content: 'View detailed metric analysis and insights' },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col gap-4">
      <div>Hello "/app/metrics/$metricId"! wow</div>
    </div>
  );
}
