import { useQueryClient } from '@tanstack/react-query';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import type { BusterMetric } from '../../asset_interfaces/metric/interfaces';
import { metricsQueryKeys } from '../../query_keys/metric';
import { useGetLatestMetricVersionMemoized } from './metricVersionNumber';

export const useGetMetricMemoized = () => {
  const queryClient = useQueryClient();
  const getLatestMetricVersion = useGetLatestMetricVersionMemoized();
  const getMetricMemoized = useMemoizedFn(
    (metricId: string, versionNumberProp?: number): BusterMetric => {
      const versionNumber = versionNumberProp || getLatestMetricVersion(metricId) || 'LATEST';
      const options = metricsQueryKeys.metricsGetMetric(metricId, versionNumber);
      const data = queryClient.getQueryData(options.queryKey);
      if (!data) {
        throw new Error('Metric not found');
      }
      return data;
    }
  );
  return getMetricMemoized;
};
