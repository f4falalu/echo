import type { BusterDataset, IDataResult, BusterDatasetListItem } from '../../asset_interfaces';
import { mainApi } from '../instances';
import { serverFetch } from '@/api/createServerInstance';
import {
  GetDatasetsParams,
  CreateDatasetParams,
  DeployDatasetParams
} from '@/api/request_interfaces/dataset';

export const getDatasets = async (params?: GetDatasetsParams): Promise<BusterDatasetListItem[]> => {
  const { page = 0, page_size = 1000, ...allParams } = params || {};
  return mainApi
    .get<BusterDatasetListItem[]>(`/datasets`, { params: { page, page_size, ...allParams } })
    .then((res) => res.data);
};

export const getDatasets_server = async (
  params?: GetDatasetsParams
): Promise<BusterDatasetListItem[]> => {
  const { page = 0, page_size = 1000, ...allParams } = params || {};
  return await serverFetch<BusterDatasetListItem[]>(`/datasets`, {
    params: { page, page_size, ...allParams }
  });
};

const GET_DATASET_URL = (datasetId: string) => `/datasets/${datasetId}`;

export const getDatasetMetadata = async (datasetId: string): Promise<BusterDataset> => {
  return await mainApi.get<BusterDataset>(GET_DATASET_URL(datasetId)).then((res) => res.data);
};

export const getDatasetMetadata_server = async (datasetId: string) => {
  return await serverFetch<BusterDataset>(GET_DATASET_URL(datasetId));
};

export const getDatasetDataSample = async (datasetId: string) => {
  return await mainApi
    .get<IDataResult>(`/datasets/${datasetId}/data/sample`)
    .then((res) => res.data);
};

export const createDataset = async (params: CreateDatasetParams): Promise<BusterDataset> => {
  return await mainApi.post<BusterDataset>(`/datasets`, params).then((res) => res.data);
};

export const deleteDataset = async (datasetIds: string[]): Promise<void> => {
  return await mainApi.delete(`/datasets`, { data: { ids: datasetIds } }).then((res) => res.data);
};

export const deployDataset = async ({
  dataset_id,
  ...params
}: DeployDatasetParams): Promise<void> => {
  return await mainApi
    .post(`/datasets/deploy`, { id: dataset_id, ...params })
    .then((res) => res.data);
};

export const updateDataset = async (data: { id: string; name: string }) => {
  return await mainApi.put(`/datasets/${data.id}`, data).then((res) => res.data);
};
