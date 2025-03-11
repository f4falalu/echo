import { mainApi } from '../instances';
import { serverFetch } from '@/api/createServerInstance';
import type { GetMetricParams, ListMetricsParams, UpdateMetricParams } from './interfaces';
import type {
  BusterMetric,
  BusterMetricData,
  BusterMetricListItem
} from '@/api/asset_interfaces/metric';

export const getMetric = async ({ id, password }: GetMetricParams) => {
  return mainApi
    .get<BusterMetric>(`/metrics/${id}`, {
      params: { id, ...(password && { password }) }
    })
    .then((res) => res.data);
};

export const getMetric_server = async ({ id, password }: GetMetricParams) => {
  return await serverFetch<BusterMetric>(`/metrics/${id}`, {
    params: { ...(password && { password }) }
  });
};

export const getMetricData = async ({ id }: { id: string }) => {
  return mainApi.get<BusterMetricData>(`/metrics/${id}/data`).then((res) => res.data);
};

export const listMetrics = async (params: ListMetricsParams) => {
  return mainApi.get<BusterMetricListItem[]>('/metrics/list', { params }).then((res) => res.data);
};

export const listMetrics_server = async (params: ListMetricsParams) => {
  return await serverFetch<BusterMetricListItem[]>('/metrics/list', { params });
};

export const updateMetric = async (params: UpdateMetricParams) => {
  return mainApi
    .put<BusterMetric>(`/metrics/update/${params.id}`, { params })
    .then((res) => res.data);
};

export const deleteMetrics = async (params: { ids: string[] }) => {
  return mainApi.delete<null>(`/metrics/delete`, { params }).then((res) => res.data);
};

export const duplicateMetric = async (params: {
  id: string;
  message_id: string;
  share_with_same_people: boolean;
}) => {
  return mainApi.post<BusterMetric>(`/metrics/duplicate`, { params }).then((res) => res.data);
};
