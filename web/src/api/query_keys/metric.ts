'use client';

import { queryOptions } from '@tanstack/react-query';
import type {
  BusterMetricData,
  BusterMetricListItem,
  IBusterMetric
} from '@/api/asset_interfaces/metric';
import { useBusterAssetsContextSelector } from '@/context/Assets/BusterAssetsProvider';
import { ListMetricsParams } from '../buster_rest/metrics';

export const metricsGetMetric = (metricId: string) => {
  return queryOptions<IBusterMetric>({
    queryKey: ['metrics', 'get', metricId] as const,
    staleTime: 30 * 60 * 1000,
    enabled: false
  });
};

export const useMetricsGetMetric = (metricId: string) => {
  const setAssetPasswordError = useBusterAssetsContextSelector(
    (state) => state.setAssetPasswordError
  );
  return queryOptions<IBusterMetric>({
    ...metricsGetMetric(metricId),
    throwOnError: (error, query) => {
      setAssetPasswordError(metricId, error.message || 'An error occurred');
      return false;
    }
  });
};

export const metricsGetList = (filters?: ListMetricsParams) =>
  queryOptions<BusterMetricListItem[]>({
    queryKey: ['metrics', 'list', filters] as const,
    staleTime: 10 * 1000
  });

export const metricsGetDataByMessageId = (messageId: string) =>
  queryOptions<BusterMetricData>({
    queryKey: ['metrics', 'data', messageId] as const,
    staleTime: 60 * 60 * 1000 // 1 hour
  });

export const metricsGetData = (id: string) =>
  queryOptions<BusterMetricData>({
    queryKey: ['metrics', 'data', id] as const,
    staleTime: 3 * 60 * 60 * 1000 // 3 hours,
  });

export const metricsQueryKeys = {
  metricsGetMetric,
  useMetricsGetMetric,
  metricsGetList,
  metricsGetDataByMessageId,
  metricsGetData
};
