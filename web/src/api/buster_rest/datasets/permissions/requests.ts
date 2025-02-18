import { mainApi } from '../../instances';
import type {
  DatasetPermissionsOverviewResponse,
  ListDatasetGroupsResponse,
  ListPermissionGroupsResponse,
  ListPermissionUsersResponse
} from '../../../asset_interfaces';
import { serverFetch } from '../../../createServerInstance';
import type {
  ListIndividualDatasetPermissionGroupsParams,
  ListDatasetDatasetGroupsParams,
  ListDatasetPermissionUsersParams,
  UpdateDatasetPermissionUsersParams,
  UpdateDatasetPermissionGroupsParams,
  UpdateDatasetDatasetGroupsParams,
  GetDatasetPermissionsOverviewParams
} from '../../../request_interfaces/dataset_permissions';

export const listIndividualDatasetPermissionGroups = async (
  params: ListIndividualDatasetPermissionGroupsParams
): Promise<ListPermissionGroupsResponse[]> => {
  return await mainApi
    .get(`/datasets/${params.dataset_id}/permission_groups`)
    .then((res) => res.data);
};

export const listDatasetDatasetGroups = async (params: ListDatasetDatasetGroupsParams) => {
  return await mainApi
    .get<ListDatasetGroupsResponse[]>(`/datasets/${params.dataset_id}/dataset_groups`)
    .then((res) => res.data);
};

export const listDatasetPermissionUsers = async (
  params: ListDatasetPermissionUsersParams
): Promise<ListPermissionUsersResponse[]> => {
  return await mainApi.get(`/datasets/${params.dataset_id}/users`).then((res) => res.data);
};

export const updateDatasetPermissionUsers = async (
  params: UpdateDatasetPermissionUsersParams
): Promise<void> => {
  return await mainApi.put(`/datasets/${params.dataset_id}/users`, params.users);
};

export const updateDatasetPermissionGroups = async (
  params: UpdateDatasetPermissionGroupsParams
): Promise<
  {
    id: string;
    assigned: boolean;
  }[]
> => {
  return await mainApi.put(`/datasets/${params.dataset_id}/permission_groups`, params.groups);
};

export const updateDatasetDatasetGroups = async (
  params: UpdateDatasetDatasetGroupsParams
): Promise<void> => {
  return await mainApi.put(`/datasets/${params.dataset_id}/dataset_groups`, params.groups);
};

const GET_PERMISSIONS_OVERVIEW = (datasetId: string) => `/datasets/${datasetId}/overview`;

export const getDatasetPermissionsOverview = async (
  params: GetDatasetPermissionsOverviewParams
): Promise<DatasetPermissionsOverviewResponse> => {
  return await mainApi.get(GET_PERMISSIONS_OVERVIEW(params.dataset_id)).then((res) => res.data);
};

export const getDatasetPermissionsOverview_server = async (datasetId: string) => {
  const response = await serverFetch<DatasetPermissionsOverviewResponse>(
    GET_PERMISSIONS_OVERVIEW(datasetId)
  );
  return response;
};
