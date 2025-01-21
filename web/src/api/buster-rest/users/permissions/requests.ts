import { mainApi } from '../../instances';
import { serverFetch } from '../../../createServerInstance';
import {
  BusterUserAttribute,
  BusterUserTeamListItem,
  BusterUserDataset,
  BusterUserDatasetGroup,
  BusterUserPermissionGroup
} from './interfaces';

export const getUserDatasetGroups = async ({ userId }: { userId: string }) => {
  return mainApi
    .get<BusterUserDatasetGroup[]>(`/users/${userId}/dataset_groups`)
    .then(({ data }) => data);
};

export const getUserDatasetGroups_server = async ({ userId }: { userId: string }) => {
  return serverFetch<BusterUserDatasetGroup[]>(`/users/${userId}/dataset_groups`);
};

export const getUserDatasets = async ({ userId }: { userId: string }) => {
  return mainApi.get<BusterUserDataset[]>(`/users/${userId}/datasets`).then(({ data }) => data);
};

export const getUserDatasets_server = async ({ userId }: { userId: string }) => {
  return serverFetch<BusterUserDataset[]>(`/users/${userId}/datasets`);
};

export const getUserAttributes = async ({ userId }: { userId: string }) => {
  return mainApi.get<BusterUserAttribute[]>(`/users/${userId}/attributes`).then(({ data }) => data);
};

export const getUserAttributes_server = async ({ userId }: { userId: string }) => {
  return serverFetch<BusterUserAttribute[]>(`/users/${userId}/attributes`);
};

export const getUserTeams = async ({ userId }: { userId: string }) => {
  return mainApi.get<BusterUserTeamListItem[]>(`/users/${userId}/teams`).then(({ data }) => data);
};

export const getUserTeams_server = async ({ userId }: { userId: string }) => {
  return serverFetch<BusterUserTeamListItem[]>(`/users/${userId}/teams`);
};

export const getUserPermissionGroups = async ({ userId }: { userId: string }) => {
  return mainApi
    .get<BusterUserPermissionGroup[]>(`/users/${userId}/permission_groups`)
    .then(({ data }) => data);
};

export const getUserPermissionGroups_server = async ({ userId }: { userId: string }) => {
  return serverFetch<BusterUserPermissionGroup[]>(`/users/${userId}/permission_groups`);
};
