import type { BusterDataset } from '../datasets';

export enum DataSourceStatus {
  ACTIVE = 'active',
  SYNCING = 'syncing',
  FAILED = 'failed',
  PAUSED = 'paused'
}

export enum DataSourceTypes {
  postgres = 'postgres',
  supabase = 'supabase',
  mysql = 'mysql',
  bigquery = 'bigquery',
  snowflake = 'snowflake',
  redshift = 'redshift',
  mariadb = 'mariadb',
  sqlserver = 'sqlserver',
  databricks = 'databricks',
  athena = 'athena',
  other = 'other'
}

export const SUPPORTED_DATASOURCES = [
  DataSourceTypes.postgres,
  DataSourceTypes.mysql,
  DataSourceTypes.mariadb,
  DataSourceTypes.sqlserver,
  DataSourceTypes.redshift,
  DataSourceTypes.bigquery,
  DataSourceTypes.databricks,
  DataSourceTypes.supabase,
  DataSourceTypes.snowflake
  //DataSourceTypes.athena
];
export const DatabaseNames: Record<DataSourceTypes, string> = {
  [DataSourceTypes.postgres]: 'Postgres',
  [DataSourceTypes.mysql]: 'MySQL',
  [DataSourceTypes.snowflake]: 'Snowflake',
  [DataSourceTypes.bigquery]: 'BigQuery',
  [DataSourceTypes.supabase]: 'Supabase',
  [DataSourceTypes.redshift]: 'Redshift',
  [DataSourceTypes.databricks]: 'DataBricks',
  [DataSourceTypes.sqlserver]: 'SQL Server',
  [DataSourceTypes.mariadb]: 'MariaDB',
  [DataSourceTypes.athena]: 'Athena',
  [DataSourceTypes.other]: 'Other'
};

export enum DataSourceTenetTypes {
  single = 'single',
  multi = 'multi'
}

export enum DataSourceEnvironment {
  production = 'production',
  development = 'development'
}

export interface PostgresCredentials {
  name: string;
  type: 'postgres' | 'supabase';
  host: string;
  port: number;
  username: string;
  password: string;
  default_database: string; //postgres
  default_schema: string; //public
}

export interface MySQLCredentials {
  name: string;
  type: 'mysql' | 'mariadb';
  host: string;
  port: number;
  username: string;
}

export interface BigQueryCredentials {
  name: string;
  type: 'bigquery';
  service_role_key: string;
  default_project_id: string;
  default_dataset_id: string;
}

export interface RedshiftCredentials {
  name: string;
  type: 'redshift';
  host: string;
  port: number;
  username: string;
  password: string;
  default_database: string;
  default_schema: string;
}

export interface SnowflakeCredentials {
  name: string;
  type: 'snowflake';
  account_id: string;
  warehouse_id: string;
  username: string;
  password: string;
  role: string | null;
  default_database: string;
  default_schema: string;
}

export interface DatabricksCredentials {
  name: string;
  type: 'databricks';
  host: string;
  api_key: string;
  warehouse_id: string;
  default_catalog: string;
  default_schema: string;
}

export interface SQLServerCredentials {
  name: string;
  type: 'sqlserver';
  host: string;
  port: number;
  username: string;
  password: string;
  default_database: string;
  default_schema: string;
}

export interface DataSource {
  created_at: '2024-07-18T21:19:49.721159Z';
  created_by: {
    email: string;
    id: string;
    name: string;
  };
  credentials:
    | PostgresCredentials
    | MySQLCredentials
    | BigQueryCredentials
    | RedshiftCredentials
    | SnowflakeCredentials
    | DatabricksCredentials
    | SQLServerCredentials;
  data_sets: { id: string; name: string }[];
  id: string;
  name: string;
  type: DataSourceTypes;
  updated_at: '2024-07-18T21:19:49.721160Z';
}

export interface DataSourceListItem {
  name: string;
  id: string;
  type: DataSourceTypes;
  updated_at: string;
}
