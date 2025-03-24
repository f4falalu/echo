import { mainApi } from '../instances';
import { serverFetch } from '@/api/createServerInstance';
import type { GetMetricParams, UpdateMetricParams } from './interfaces';
import type {
  BusterMetric,
  BusterMetricData,
  BusterMetricListItem
} from '@/api/asset_interfaces/metric';
import type {
  ShareDeleteRequest,
  SharePostRequest,
  ShareUpdateRequest
} from '@/api/asset_interfaces/shared_interfaces';
import { VerificationStatus } from '@/api/asset_interfaces/share';

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

export const listMetrics = async (params: {
  /** The token representing the current page number for pagination */
  page_token: number;
  /** The number of items to return per page */
  page_size: number;
  /** Filtering options for metrics based on verification status */
  status?: VerificationStatus[] | null;
}) => {
  return mainApi.get<BusterMetricListItem[]>('/metrics', { params }).then((res) => res.data);
};

export const listMetrics_server = async (params: Parameters<typeof listMetrics>[0]) => {
  return await serverFetch<BusterMetricListItem[]>('/metrics', { params });
};

export const updateMetric = async (params: UpdateMetricParams) => {
  return mainApi.put<BusterMetric>(`/metrics/${params.id}`, params).then((res) => res.data);
};

export const deleteMetrics = async (params: { ids: string[] }) => {
  return mainApi
    .delete<null>(`/metrics`, {
      data: { ids: params.ids }
    })
    .then((res) => res.data);
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
  return mainApi.put<BusterMetric>(`/metrics/${id}/sharing`, params).then((res) => res.data);
};
