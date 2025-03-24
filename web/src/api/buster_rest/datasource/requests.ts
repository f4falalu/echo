import type { DataSource, DataSourceListItem } from '@/api/asset_interfaces/datasources';
import mainApi from '../instances';
import { DatasourcePostParams, DatasourceUpdateParams } from '@/api/request_interfaces/datasources';

export const listDatasources = async () => {
  return await mainApi.get<DataSourceListItem[]>('/data_sources').then((res) => res.data);
};

export const getDatasource = async (id: string) => {
  return await mainApi.get<DataSource>(`/data_sources/${id}`).then((res) => res.data);
};

export const deleteDatasource = async (id: string) => {
  return await mainApi.delete(`/data_sources/${id}`).then((res) => res.data);
};

export const createDatasource = async (datasource: DatasourcePostParams) => {
  return await mainApi.post<DataSource>('/data_sources', datasource).then((res) => res.data);
};

export const updateDatasource = async (params: DatasourceUpdateParams) => {
  return await mainApi
    .put<DataSource>(`/data_sources/${params.id}`, params)
    .then((res) => res.data);
};
