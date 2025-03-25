import type {
  BigQueryCredentials,
  DatabricksCredentials,
  DataSource,
  DataSourceListItem,
  MySQLCredentials,
  PostgresCredentials,
  SnowflakeCredentials,
  SQLServerCredentials
} from '@/api/asset_interfaces/datasources';
import mainApi from '../instances';
import {
  DatasourceUpdateParams,
  RedshiftCreateCredentials
} from '@/api/request_interfaces/datasources';
import { MySQLCreateParams } from './types';

export const listDatasources = async () => {
  return await mainApi.get<DataSourceListItem[]>('/data_sources').then((res) => res.data);
};

export const getDatasource = async (id: string) => {
  return await mainApi.get<DataSource>(`/data_sources/${id}`).then((res) => res.data);
};

export const deleteDatasource = async (id: string) => {
  return await mainApi.delete(`/data_sources/${id}`).then((res) => res.data);
};

export const createPostgresDataSource = async (params: PostgresCredentials) => {
  return mainApi.post<DataSource>('/data_sources', params).then((res) => res.data);
};

export const updatePostgresDataSource = async ({
  id,
  ...params
}: Parameters<typeof createPostgresDataSource>[0] & { id: string }) => {
  return mainApi.put<DataSource>(`/data_sources/${id}`, params).then((res) => res.data);
};

export const createMySQLDataSource = async (params: MySQLCredentials) => {
  return mainApi.post<DataSource>('/data_sources', params).then((res) => res.data);
};

export const updateMySQLDataSource = async ({
  id,
  ...params
}: Parameters<typeof createMySQLDataSource>[0] & { id: string }) => {
  return mainApi.put<DataSource>(`/data_sources/${id}`, params).then((res) => res.data);
};

export const createRedshiftDataSource = async (params: RedshiftCreateCredentials) => {
  return mainApi.post<DataSource>('/data_sources', params).then((res) => res.data);
};

export const updateRedshiftDataSource = async ({
  id,
  ...params
}: Parameters<typeof createRedshiftDataSource>[0] & { id: string }) => {
  return mainApi.put<DataSource>(`/data_sources/${id}`, params).then((res) => res.data);
};

export const createBigQueryDataSource = async (params: BigQueryCredentials) => {
  return mainApi.post<DataSource>('/data_sources', params).then((res) => res.data);
};

export const updateBigQueryDataSource = async ({
  id,
  ...params
}: Parameters<typeof createBigQueryDataSource>[0] & { id: string }) => {
  return mainApi.put<DataSource>(`/data_sources/${id}`, params).then((res) => res.data);
};

export const createSnowflakeDataSource = async (params: SnowflakeCredentials) => {
  return mainApi.post<DataSource>('/data_sources', params).then((res) => res.data);
};

export const updateSnowflakeDataSource = async ({
  id,
  ...params
}: Parameters<typeof createSnowflakeDataSource>[0] & { id: string }) => {
  return mainApi.put<DataSource>(`/data_sources/${id}`, params).then((res) => res.data);
};

export const createDatabricksDataSource = async (params: DatabricksCredentials) => {
  return mainApi.post<DataSource>('/data_sources', params).then((res) => res.data);
};

export const updateDatabricksDataSource = async ({
  id,
  ...params
}: Parameters<typeof createDatabricksDataSource>[0] & { id: string }) => {
  return mainApi.put<DataSource>(`/data_sources/${id}`, params).then((res) => res.data);
};

export const createSQLServerDataSource = async (params: SQLServerCredentials) => {
  return mainApi.post<DataSource>('/data_sources', params).then((res) => res.data);
};

export const updateSQLServerDataSource = async ({
  id,
  ...params
}: Parameters<typeof createSQLServerDataSource>[0] & { id: string }) => {
  return mainApi.put<DataSource>(`/data_sources/${id}`, params).then((res) => res.data);
};
