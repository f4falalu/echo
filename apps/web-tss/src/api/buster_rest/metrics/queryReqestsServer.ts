import { QueryClient } from '@tanstack/react-query';
import { metricsQueryKeys } from '@/api/query_keys/metric';
import { upgradeMetricToIMetric } from '@/lib/metrics';
import { getMetric } from './requests';

export const prefetchGetMetric = async (
  params: Parameters<typeof getMetric>[0],
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();
  const queryKey = metricsQueryKeys.metricsGetMetric(
    params.id,
    params.version_number || 'LATEST'
  )?.queryKey;
  const existingData = queryClient.getQueryData(queryKey);

  if (!existingData) {
    await queryClient.prefetchQuery({
      ...metricsQueryKeys.metricsGetMetric(params.id, params.version_number || 'LATEST'),
      queryFn: async () => {
        const result = await getMetric(params);
        return upgradeMetricToIMetric(result, null);
      },
    });
  }

  return existingData || queryClient.getQueryData(queryKey);
};
