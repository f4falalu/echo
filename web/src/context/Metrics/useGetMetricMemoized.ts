import type { IBusterMetric } from '@/api/asset_interfaces/metric';
import { useGetMetricVersionNumber } from '@/api/buster_rest/metrics';
import { queryKeys } from '@/api/query_keys';
import { useMemoizedFn } from '@/hooks';
import { resolveEmptyMetric } from '@/lib/metrics/resolve';
import { useQueryClient } from '@tanstack/react-query';

export const useGetMetricMemoized = () => {
  const queryClient = useQueryClient();
  const versionNumber = useGetMetricVersionNumber({});
  const getMetricMemoized = useMemoizedFn(
    (metricId: string, versionNumberProp?: number): IBusterMetric => {
      const options = queryKeys.metricsGetMetric(metricId, versionNumberProp || versionNumber);
      const data = queryClient.getQueryData(options.queryKey);
      return resolveEmptyMetric(data, metricId);
    }
  );
  return getMetricMemoized;
};
