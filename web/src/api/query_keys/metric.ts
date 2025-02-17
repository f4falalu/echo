'use client';

import { queryOptions } from '@tanstack/react-query';
import type { BusterMetricListItem } from '@/api/asset_interfaces';
import type { MetricListRequest } from '@/api/request_interfaces/metrics';
import type { BusterMetricData } from '@/context/MetricData';
import { IBusterMetric } from '@/context/Metrics';
import { useBusterAssetsContextSelector } from '@/context/Assets/BusterAssetsProvider';

export const useMetricsGetMetric = (metricId: string) => {
  const setAssetPasswordError = useBusterAssetsContextSelector(
    (state) => state.setAssetPasswordError
  );
  return queryOptions<IBusterMetric>({
    queryKey: ['metrics', 'get', metricId] as const,
    staleTime: 30 * 60 * 1000,
    enabled: false,
    throwOnError: (error, query) => {
      setAssetPasswordError(metricId, error.message || 'An error occurred');
      return false;
    }
  });
};

export const metricsGetList = (filters?: MetricListRequest) =>
  queryOptions<BusterMetricListItem[]>({
    queryKey: ['metrics', 'list', filters] as const,
    staleTime: 10 * 1000
  });

export const metricsGetDataByMessageId = (messageId: string) =>
  queryOptions<BusterMetricData>({
    queryKey: ['metrics', 'data', messageId] as const,
    staleTime: 60 * 60 * 1000 // 1 hour
  });

export const metricsQueryKeys = {
  '/metrics/get:getMetric': useMetricsGetMetric,
  '/metrics/list:getMetricsList': metricsGetList,
  '/metrics/get:fetchingData': metricsGetDataByMessageId
};
