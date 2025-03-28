import { queryOptions } from '@tanstack/react-query';
import type {
  BusterMetricListItem,
  IBusterMetric,
  IBusterMetricData
} from '@/api/asset_interfaces/metric';
import { type listMetrics } from '../buster_rest/metrics';

export const metricsGetMetric = (metricId: string, version_number?: number) => {
  return queryOptions<IBusterMetric>({
    queryKey: ['metrics', 'get', metricId, version_number] as const,
    staleTime: 30 * 60 * 1000
  });
};

export const metricsGetList = (filters?: Parameters<typeof listMetrics>[0]) =>
  queryOptions<BusterMetricListItem[]>({
    queryKey: ['metrics', 'list', filters] as const,
    staleTime: 60 * 1000
  });

export const metricsGetData = (id: string, version_number?: number) =>
  queryOptions<IBusterMetricData>({
    queryKey: ['metrics', 'data', id, version_number] as const,
    staleTime: 3 * 60 * 60 * 1000 // 3 hours,
  });

export const metricsQueryKeys = {
  metricsGetMetric,
  metricsGetList,
  metricsGetData
};
