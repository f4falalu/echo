import { queryOptions } from '@tanstack/react-query';
import type { BusterMetric, MetricData } from './interfaces';
import type { BusterMetricListItem } from './listInterfaces';
import type { MetricListRequest } from '@/api/request_interfaces/metrics';

export const metricsGetMetric = (metricId: string) =>
  queryOptions<BusterMetric>({
    queryKey: ['metrics', 'get', metricId] as const,
    staleTime: 10 * 1000
  });

export const metricsGetList = (filters?: MetricListRequest) =>
  queryOptions<BusterMetricListItem[]>({
    queryKey: ['metrics', 'list', filters] as const,
    staleTime: 10 * 1000
  });

export const metricsGetDataByMessageId = (messageId: string) =>
  queryOptions<MetricData>({
    queryKey: ['metrics', 'data', messageId] as const,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

export const metricsQueryKeys = {
  '/metrics/get:getMetric': metricsGetMetric,
  '/metrics/list:getMetricsList': metricsGetList,
  '/metrics/data:getDataByMessageId': metricsGetDataByMessageId
};
