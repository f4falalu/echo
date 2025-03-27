import { prefetchGetMetric } from '@/api/buster_rest/metrics/queryReqestsServer';
import { queryKeys } from '@/api/query_keys';
import { MetricController } from '@/controllers/MetricController';
import { AppAssetCheckLayout } from '@/layouts/AppAssetCheckLayout';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

export default async function Page(props: {
  params: Promise<{ chatId: string; metricId: string }>;
}) {
  const params = await props.params;
  const { chatId, metricId } = params;

  const queryClient = await prefetchGetMetric({ id: metricId });

  // const state = queryClient.getQueryState(queryKeys.metricsGetMetric(metricId).queryKey);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AppAssetCheckLayout assetId={metricId} type="metric">
        <MetricController metricId={metricId} />
      </AppAssetCheckLayout>
    </HydrationBoundary>
  );
}
