import { serverFetch } from '@/api/createServerInstance';
import { mainApi } from '../instances';
import type {
  DatasetGroup,
  GetDatasetGroupPermissionGroupsResponse,
  GetDatasetGroupDatasetsResponse,
  GetDatasetGroupUsersResponse,
  ListDatasetGroupsResponse
} from '../../asset_interfaces';
import type {
  CreateDatasetGroupRequest,
  UpdateDatasetGroupRequest,
  UpdateDatasetGroupUsersRequest,
  UpdateDatasetGroupDatasetsRequest,
  UpdateDatasetGroupPermissionGroupsRequest
} from '@/api/request_interfaces/dataset_groups';

export const listDatasetGroups = async () => {
  return mainApi.get<ListDatasetGroupsResponse[]>(`/dataset_groups`).then((res) => res.data);
};

export const createDatasetGroup = async (data: CreateDatasetGroupRequest) => {
  return mainApi.post(`/dataset_groups`, data).then((res) => res.data);
};

export const updateDatasetGroup = async (data: UpdateDatasetGroupRequest[]) => {
  return mainApi.put(`/dataset_groups`, data).then((res) => res.data);
};

export const deleteDatasetGroup = async (id: string) => {
  return mainApi.delete(`/dataset_groups/${id}`).then((res) => res.data);
};

export const getDatasetGroup = async (id: string) => {
  return mainApi.get<DatasetGroup>(`/dataset_groups/${id}`).then((res) => res.data);
};

export const getDatasetGroup_server = async (id: string) => {
  return serverFetch<DatasetGroup>(`/dataset_groups/${id}`);
};

export const getDatasetGroupUsers = async (id: string) => {
  return mainApi
    .get<GetDatasetGroupUsersResponse[]>(`/dataset_groups/${id}/users`)
    .then((res) => res.data);
};

export const getDatasetGroupUsers_server = async (id: string) => {
  return serverFetch<GetDatasetGroupUsersResponse[]>(`/dataset_groups/${id}/users`);
};

export const getDatasetGroupDatasets = async (id: string) => {
  return mainApi
    .get<GetDatasetGroupDatasetsResponse[]>(`/dataset_groups/${id}/datasets`)
    .then((res) => res.data);
};

export const getDatasetGroupDatasets_server = async (id: string) => {
  return serverFetch<GetDatasetGroupDatasetsResponse[]>(`/dataset_groups/${id}/datasets`);
};

export const getDatasetGroupPermissionGroups = async (id: string) => {
  return mainApi
    .get<GetDatasetGroupPermissionGroupsResponse[]>(`/dataset_groups/${id}/permission_groups`)
    .then((res) => res.data);
};

export const getDatasetGroupPermissionGroups_server = async (id: string) => {
  return serverFetch<GetDatasetGroupPermissionGroupsResponse[]>(
    `/dataset_groups/${id}/permission_groups`
  );
};

export const updateDatasetGroupUsers = async (id: string, data: UpdateDatasetGroupUsersRequest) => {
  return mainApi.put(`/dataset_groups/${id}/users`, data).then((res) => res.data);
};

export const updateDatasetGroupDatasets = async (
  id: string,
  data: UpdateDatasetGroupDatasetsRequest
) => {
  return mainApi.put(`/dataset_groups/${id}/datasets`, data).then((res) => res.data);
};

export const updateDatasetGroupPermissionGroups = async (
  id: string,
  data: UpdateDatasetGroupPermissionGroupsRequest
) => {
  return mainApi.put(`/dataset_groups/${id}/permission_groups`, data).then((res) => res.data);
};
