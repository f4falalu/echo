'use client';

import { queryOptions } from '@tanstack/react-query';
import type {
  BusterMetricListItem,
  IBusterMetric,
  IBusterMetricData
} from '@/api/asset_interfaces/metric';
import { ListMetricsParams } from '../buster_rest/metrics';

export const metricsGetMetric = (metricId: string) => {
  return queryOptions<IBusterMetric>({
    queryKey: ['metrics', 'get', metricId] as const,
    staleTime: 30 * 60 * 1000
  });
};

export const metricsGetList = (filters?: ListMetricsParams) =>
  queryOptions<BusterMetricListItem[]>({
    queryKey: ['metrics', 'list', filters] as const,
    staleTime: 10 * 1000
  });

export const metricsGetData = (id: string) =>
  queryOptions<IBusterMetricData>({
    queryKey: ['metrics', 'data', id] as const,
    staleTime: 3 * 60 * 60 * 1000 // 3 hours,
  });

export const metricsQueryKeys = {
  metricsGetMetric,
  metricsGetList,
  metricsGetData
};
