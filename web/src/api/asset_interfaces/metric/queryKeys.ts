import { queryOptions } from '@tanstack/react-query';
import type { BusterMetric } from './interfaces';
import type { BusterMetricListItem } from './listInterfaces';
import type { MetricListRequest } from '@/api/request_interfaces/metrics';
import type { BusterMetricData } from '@/context/MetricData';

export const metricsGetMetric = (metricId: string) =>
  queryOptions<BusterMetric>({
    queryKey: ['metrics', 'get', metricId] as const,
    staleTime: 10 * 1000,
    enabled: false
  });

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
  '/metrics/get:getMetric': metricsGetMetric,
  '/metrics/list:getMetricsList': metricsGetList,
  '/metrics/get:fetchingData': metricsGetDataByMessageId
};
