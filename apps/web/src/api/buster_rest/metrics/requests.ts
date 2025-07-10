import type {
  BulkUpdateMetricVerificationStatusRequest,
  BulkUpdateMetricVerificationStatusResponse,
  ShareDeleteRequest,
  ShareUpdateRequest,
  DeleteMetricRequest,
  DeleteMetricResponse,
  DuplicateMetricRequest,
  DuplicateMetricResponse,
  GetMetricDataRequest,
  ListMetricsResponse,
  ShareMetricRequest,
  ShareMetricResponse,
  UpdateMetricRequest,
  GetMetricRequest,
  GetMetricListRequest,
  ShareDeleteResponse,
  MetricDataResponse,
  GetMetricResponse,
  UpdateMetricResponse,
  ShareUpdateResponse
} from '@buster/server-shared/metrics';
import { serverFetch } from '@/api/createServerInstance';
import { mainApi } from '../instances';

export const getMetric = async (params: GetMetricRequest): Promise<GetMetricResponse> => {
  return mainApi
    .get<GetMetricResponse>(`/metrics/${params.id}`, {
      params
    })
    .then((res) => res.data);
};

export const getMetric_server = async ({ id, password }: Parameters<typeof getMetric>[0]) => {
  return await serverFetch<GetMetricResponse>(`/metrics/${id}`, {
    params: { ...(password && { password }) }
  });
};

export const getMetricData = async ({
  id,
  version_number,
  password
}: GetMetricDataRequest): Promise<MetricDataResponse> => {
  return mainApi
    .get<MetricDataResponse>(`/metrics/${id}/data`, { params: { password, version_number } })
    .then((res) => res.data);
};

export const listMetrics = async (params: GetMetricListRequest) => {
  return mainApi.get<ListMetricsResponse>('/metrics', { params }).then((res) => res.data);
};

export const listMetrics_server = async (params: Parameters<typeof listMetrics>[0]) => {
  return await serverFetch<ListMetricsResponse>('/metrics', { params });
};

export const updateMetric = async (params: UpdateMetricRequest) => {
  return mainApi.put<UpdateMetricResponse>(`/metrics/${params.id}`, params).then((res) => res.data);
};

export const deleteMetrics = async (data: DeleteMetricRequest) => {
  return mainApi
    .delete<DeleteMetricResponse>('/metrics', {
      data
    })
    .then((res) => res.data);
};

export const duplicateMetric = async (params: DuplicateMetricRequest) => {
  return mainApi
    .post<DuplicateMetricResponse>('/metrics/duplicate', params)
    .then((res) => res.data);
};

export const bulkUpdateMetricVerificationStatus = async (
  params: BulkUpdateMetricVerificationStatusRequest
) => {
  return mainApi
    .put<BulkUpdateMetricVerificationStatusResponse>('/metrics', params)
    .then((res) => res.data);
};

// share metrics

export const shareMetric = async ({ id, params }: { id: string; params: ShareMetricRequest }) => {
  return mainApi
    .post<ShareMetricResponse>(`/metrics/${id}/sharing`, params)
    .then((res) => res.data);
};

export const unshareMetric = async ({ id, data }: { id: string; data: ShareDeleteRequest }) => {
  return mainApi
    .delete<ShareDeleteResponse>(`/metrics/${id}/sharing`, { data })
    .then((res) => res.data);
};

export const updateMetricShare = async ({
  params,
  id
}: {
  id: string;
  params: ShareUpdateRequest;
}) => {
  return mainApi.put<ShareUpdateResponse>(`/metrics/${id}/sharing`, params).then((res) => res.data);
};
