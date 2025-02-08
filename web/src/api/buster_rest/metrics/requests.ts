import { mainApi } from '../instances';
import { serverFetch } from '@/api/createServerInstance';
import { GetMetricParams, ListMetricsParams } from './interfaces';
import { BusterMetric, BusterMetricListItem } from '@/api/asset_interfaces';

export const getMetric = async ({ id, password }: GetMetricParams) => {
  return mainApi
    .get<BusterMetric>(`/metrics/get`, {
      params: { id, ...(password && { password }) }
    })
    .then((res) => res.data);
};

export const getMetric_server = async ({ id, password }: GetMetricParams) => {
  return await serverFetch<BusterMetric>(`/metrics/get`, {
    params: { id, ...(password && { password }) }
  });
};

export const listMetrics = async (params: ListMetricsParams) => {
  return mainApi.get<BusterMetricListItem[]>('/metrics/list', { params }).then((res) => res.data);
};

export const listMetrics_server = async (params: ListMetricsParams) => {
  return await serverFetch<BusterMetricListItem[]>('/metrics/list', { params });
};
