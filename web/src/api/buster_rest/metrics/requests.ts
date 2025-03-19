import { mainApi } from '../instances';
import { serverFetch } from '@/api/createServerInstance';
import type { GetMetricParams, ListMetricsParams, UpdateMetricParams } from './interfaces';
import type {
  BusterMetric,
  BusterMetricData,
  BusterMetricListItem
} from '@/api/asset_interfaces/metric';
import { ShareRole } from '@/api/asset_interfaces/share';
import {
  ShareDeleteRequest,
  SharePostRequest,
  ShareUpdateRequest
} from '@/api/asset_interfaces/shared_interfaces';

export const getMetric = async ({ id, password, version_number }: GetMetricParams) => {
  return mainApi
    .get<BusterMetric>(`/metrics/${id}`, {
      params: { password, version_number }
    })
    .then((res) => res.data);
};

export const getMetric_server = async ({ id, password }: GetMetricParams) => {
  return await serverFetch<BusterMetric>(`/metrics/${id}`, {
    params: { ...(password && { password }) }
  });
};

export const getMetricData = async ({
  id,
  version_number
}: {
  id: string;
  version_number?: number;
}) => {
  return mainApi
    .get<BusterMetricData>(`/metrics/${id}/data`, { params: { version_number } })
    .then((res) => res.data);
};

export const listMetrics = async (params: ListMetricsParams) => {
  return mainApi.get<BusterMetricListItem[]>('/metrics', { params }).then((res) => res.data);
};

export const listMetrics_server = async (params: ListMetricsParams) => {
  return await serverFetch<BusterMetricListItem[]>('/metrics', { params });
};

export const updateMetric = async (params: UpdateMetricParams) => {
  return mainApi.put<BusterMetric>(`/metrics/${params.id}`, params).then((res) => res.data);
};

export const deleteMetrics = async (params: { ids: string[] }) => {
  return mainApi.delete<null>(`/metrics/delete`, { params }).then((res) => res.data);
};

export const duplicateMetric = async (params: {
  id: string;
  message_id: string;
  share_with_same_people: boolean;
}) => {
  return mainApi.post<BusterMetric>(`/metrics/duplicate`, params).then((res) => res.data);
};

// share metrics

export const shareMetric = async ({ id, params }: { id: string; params: SharePostRequest }) => {
  return mainApi.post<BusterMetric>(`/metrics/${id}/sharing`, params).then((res) => res.data);
};

export const unshareMetric = async ({ id, data }: { id: string; data: ShareDeleteRequest }) => {
  return mainApi.delete<BusterMetric>(`/metrics/${id}/sharing`, { data }).then((res) => res.data);
};

export const updateMetricShare = async ({
  params,
  id
}: {
  id: string;
  params: ShareUpdateRequest;
}) => {
  return mainApi.put<BusterMetric>(`/metrics/${id}/sharing`, { params }).then((res) => res.data);
};
