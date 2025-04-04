import { prefetchGetMetric } from '@/api/buster_rest/metrics';
import { metricsQueryKeys } from '@/api/query_keys/metric';
import { HydrationBoundaryMetricStore } from '@/context/Metrics/useOriginalMetricStore';
import { AppAssetCheckLayout } from '@/layouts/AppAssetCheckLayout';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

export default async function MetricLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ metricId: string }>;
}) {
  const { metricId } = await params;
  const queryClient = await prefetchGetMetric({ id: metricId });

  const metric = queryClient.getQueryData(metricsQueryKeys.metricsGetMetric(metricId).queryKey);
  // const state = queryClient.getQueryState(queryKeys.metricsGetMetric(metricId).queryKey);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HydrationBoundaryMetricStore metric={metric}>
        <AppAssetCheckLayout assetId={metricId} type="metric">
          {children}
        </AppAssetCheckLayout>
      </HydrationBoundaryMetricStore>
    </HydrationBoundary>
  );
}
