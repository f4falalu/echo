import type { AssetType } from '@buster/server-shared/assets';
import type { QueryClient } from '@tanstack/react-query';
import { Outlet } from '@tanstack/react-router';
import { z } from 'zod';
import { prefetchGetMetric } from '@/api/buster_rest/metrics';
import { useGetMetricParams } from '@/context/Metrics/useGetMetricParams';
import { MetricAssetContainer } from '@/layouts/AssetContainer/MetricAssetContainer';

export const validateSearch = z.object({
  metric_version_number: z.coerce.number().optional(),
});

export const staticData = {
  assetType: 'metric' as AssetType,
};

export const loader = async ({
  params: { metricId },
  context: { queryClient },
  deps: { metric_version_number },
}: {
  params: { metricId: string };
  deps: { metric_version_number?: number };
  context: { queryClient: QueryClient };
}): Promise<{
  title: string | undefined;
}> => {
  const data = await prefetchGetMetric(
    { id: metricId, version_number: metric_version_number },
    queryClient
  );
  return {
    title: data?.name,
  };
};

export const head = ({ loaderData }: { loaderData?: { title: string | undefined } } = {}) => ({
  meta: [
    { title: loaderData?.title || 'Metric' },
    { name: 'description', content: 'View detailed metric analysis and insights' },
    { name: 'og:title', content: 'Metric' },
    { name: 'og:description', content: 'View detailed metric analysis and insights' },
  ],
});

export const component = () => {
  const params = useGetMetricParams();

  return (
    <MetricAssetContainer {...params}>
      <Outlet />
    </MetricAssetContainer>
  );
};

export const ssr = false;
