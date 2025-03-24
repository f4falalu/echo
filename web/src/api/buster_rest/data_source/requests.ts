import type { DataSource, DataSourceListItem } from '@/api/asset_interfaces/datasources';
import mainApi from '../instances';
import { DatasourceUpdateParams } from '@/api/request_interfaces/datasources';

export const listDatasources = async () => {
  return await mainApi.get<DataSourceListItem[]>('/data_sources').then((res) => res.data);
};

export const getDatasource = async (id: string) => {
  return await mainApi.get<DataSource>(`/data_sources/${id}`).then((res) => res.data);
};

export const deleteDatasource = async (id: string) => {
  return await mainApi.delete(`/data_sources/${id}`).then((res) => res.data);
};

export const createPostgresDataSource = async (params: {
  name: string;
  type: 'postgres';
  host: string;
  port: number;
  username: string;
  password: string;
  default_database: string; //postgres
  default_schema: string; //public
}) => {
  return mainApi.post<DataSource>('/data_sources', params).then((res) => res.data);
};

export const updatePostgresDataSource = async ({
  id,
  ...params
}: Parameters<typeof createPostgresDataSource>[0] & { id: string }) => {
  return mainApi.put<DataSource>(`/data_sources/${id}`, params).then((res) => res.data);
};

export const createMySQLDataSource = async (params: {
  name: string;
  type: 'mysql' | 'mariadb';
  host: string;
  port: number;
  username: string;
  password: string;
  default_database: string;
}) => {
  return mainApi.post<DataSource>('/data_sources', params).then((res) => res.data);
};

export const updateMySQLDataSource = async ({
  id,
  ...params
}: Parameters<typeof createMySQLDataSource>[0] & { id: string }) => {
  return mainApi.put<DataSource>(`/data_sources/${id}`, params).then((res) => res.data);
};

export const createRedshiftDataSource = async (params: {
  name: string;
  type: 'redshift';
  host: string;
  port: number;
  username: string;
  password: string;
  default_database: string;
  default_schema: string;
}) => {
  return mainApi.post<DataSource>('/data_sources', params).then((res) => res.data);
};

export const updateRedshiftDataSource = async ({
  id,
  ...params
}: Parameters<typeof createRedshiftDataSource>[0] & { id: string }) => {
  return mainApi.put<DataSource>(`/data_sources/${id}`, params).then((res) => res.data);
};

export const createBigQueryDataSource = async (params: {
  name: string;
  type: 'bigquery';
  service_role_key: string;
  default_project_id: string;
  default_dataset_id: string;
}) => {
  return mainApi.post<DataSource>('/data_sources', params).then((res) => res.data);
};

export const updateBigQueryDataSource = async ({
  id,
  ...params
}: Parameters<typeof createBigQueryDataSource>[0] & { id: string }) => {
  return mainApi.put<DataSource>(`/data_sources/${id}`, params).then((res) => res.data);
};

export const createSnowflakeDataSource = async (params: {
  name: string;
  type: 'snowflake';
  account_id: string;
  warehouse_id: string;
  username: string;
  password: string;
  role: string | null;
  default_database: string;
  default_schema: string;
}) => {
  return mainApi.post<DataSource>('/data_sources', params).then((res) => res.data);
};

export const updateSnowflakeDataSource = async ({
  id,
  ...params
}: Parameters<typeof createSnowflakeDataSource>[0] & { id: string }) => {
  return mainApi.put<DataSource>(`/data_sources/${id}`, params).then((res) => res.data);
};

export const createDatabricksDataSource = async (params: {
  name: string;
  type: 'databricks';
  host: string;
  api_key: string;
  warehouse_id: string;
  default_catalog: string;
  default_schema: string;
}) => {
  return mainApi.post<DataSource>('/data_sources', params).then((res) => res.data);
};

export const updateDatabricksDataSource = async ({
  id,
  ...params
}: Parameters<typeof createDatabricksDataSource>[0] & { id: string }) => {
  return mainApi.put<DataSource>(`/data_sources/${id}`, params).then((res) => res.data);
};

export const createSQLServerDataSource = async (params: {
  name: string;
  type: 'sqlserver';
  host: string;
  port: number;
  username: string;
  password: string;
  default_database: string;
  default_schema: string;
}) => {
  return mainApi.post<DataSource>('/data_sources', params).then((res) => res.data);
};

export const updateSQLServerDataSource = async ({
  id,
  ...params
}: Parameters<typeof createSQLServerDataSource>[0] & { id: string }) => {
  return mainApi.put<DataSource>(`/data_sources/${id}`, params).then((res) => res.data);
};
