import mainApi from '@/api/buster_rest/instances';
import type {
  DashboardsListRequest,
  DashboardCreateRequest,
  DashboardUpdateRequest,
  DashboardSubscribeRequest
} from '@/api/request_interfaces/dashboards/interfaces';
import type {
  BusterDashboardListItem,
  BusterDashboardResponse
} from '@/api/asset_interfaces/dashboard';
import { ShareRole } from '@/api/asset_interfaces';
import {
  ShareDeleteRequest,
  SharePostRequest,
  ShareUpdateRequest
} from '@/api/asset_interfaces/shared_interfaces';

export const dashboardsGetList = async (params: DashboardsListRequest) => {
  return await mainApi
    .get<BusterDashboardListItem[]>('/dashboards', { params })
    .then((res) => res.data);
};

export const dashboardsGetDashboard = async ({ id, password }: DashboardSubscribeRequest) => {
  return await mainApi
    .get<BusterDashboardResponse>(`/dashboards/${id}`, { params: { password } })
    .then((res) => res.data);
};

export const dashboardsCreateDashboard = async (params: DashboardCreateRequest) => {
  return await mainApi.post<BusterDashboardResponse>('/dashboards', params).then((res) => res.data);
};

export const dashboardsUpdateDashboard = async (params: DashboardUpdateRequest) => {
  return await mainApi
    .put<BusterDashboardResponse>(`/dashboards/${params.id}`, params)
    .then((res) => res.data);
};

export const dashboardsDeleteDashboard = async ({ ids }: { ids: string[] }) => {
  return await mainApi.delete<null>(`/dashboards`, { data: { ids } }).then((res) => res.data);
};

// share dashboards

export const shareDashboard = async ({ id, params }: { id: string; params: SharePostRequest }) => {
  return mainApi
    .post<BusterDashboardResponse>(`/dashboards/${id}/sharing`, params)
    .then((res) => res.data);
};

export const unshareDashboard = async ({ id, data }: { id: string; data: ShareDeleteRequest }) => {
  return mainApi
    .delete<BusterDashboardResponse>(`/dashboards/${id}/sharing`, { data })
    .then((res) => res.data);
};

export const updateDashboardShare = async ({
  params,
  id
}: {
  id: string;
  params: ShareUpdateRequest;
}) => {
  return mainApi
    .put<BusterDashboardResponse>(`/dashboards/${id}/sharing`, params)
    .then((res) => res.data);
};
