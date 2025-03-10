import mainApi from '@/api/buster_rest/instances';
import type {
  DashboardsListRequest,
  DashboardCreateRequest,
  DashboardUpdateRequest
} from '@/api/request_interfaces/dashboards/interfaces';
import type {
  BusterDashboardListItem,
  BusterDashboardResponse
} from '@/api/asset_interfaces/dashboard';

export const dashboardsGetList = async (params: DashboardsListRequest) => {
  return await mainApi
    .get<BusterDashboardListItem[]>('/dashboards', { params })
    .then((res) => res.data);
};

export const dashboardsGetDashboard = async (id: string) => {
  return await mainApi.get<BusterDashboardResponse>(`/dashboards/${id}`).then((res) => res.data);
};

export const dashboardsCreateDashboard = async (params: DashboardCreateRequest) => {
  return await mainApi
    .post<BusterDashboardResponse>('/dashboards', { params })
    .then((res) => res.data);
};

export const dashboardsUpdateDashboard = async (params: DashboardUpdateRequest) => {
  return await mainApi
    .put<BusterDashboardResponse>(`/dashboards/${params.id}`, { params })
    .then((res) => res.data);
};

export const dashboardsDeleteDashboard = async ({ ids }: { ids: string[] }) => {
  return await mainApi.delete<null>(`/dashboards`, { data: { ids } }).then((res) => res.data);
};
