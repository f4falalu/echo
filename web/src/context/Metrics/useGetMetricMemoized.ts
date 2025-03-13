import type { IBusterMetric } from '@/api/asset_interfaces/metric';
import { queryKeys } from '@/api/query_keys';
import { useMemoizedFn } from '@/hooks';
import { resolveEmptyMetric } from '@/lib/metrics/resolve';
import { useQueryClient } from '@tanstack/react-query';

export const useGetMetricMemoized = () => {
  const queryClient = useQueryClient();
  const getMetricMemoized = useMemoizedFn((metricId: string): IBusterMetric => {
    const options = queryKeys.metricsGetMetric(metricId);
    const data = queryClient.getQueryData(options.queryKey);
    return resolveEmptyMetric(data, metricId);
  });
  return getMetricMemoized;
};
