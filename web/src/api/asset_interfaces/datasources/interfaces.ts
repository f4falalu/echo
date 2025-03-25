import * as v from 'valibot';

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
  DataSourceTypes.supabase,
  DataSourceTypes.mysql,
  DataSourceTypes.mariadb,
  DataSourceTypes.sqlserver,
  DataSourceTypes.redshift,
  DataSourceTypes.bigquery,
  DataSourceTypes.databricks,
  DataSourceTypes.snowflake
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

export const PostgresCredentialsSchema = v.object({
  name: v.pipe(v.string(), v.minLength(3, 'Name must be at least 3 characters')),
  type: v.union([v.literal('postgres'), v.literal('supabase')]),
  host: v.string(),
  port: v.pipe(
    v.number(),
    v.minValue(1, 'Port must be greater than 0'),
    v.maxValue(65535, 'Port must be less than or equal to 65535')
  ),
  username: v.string(),
  password: v.string(),
  default_database: v.string(), // postgres
  default_schema: v.string() // public
});

export type PostgresCredentials = v.InferOutput<typeof PostgresCredentialsSchema>;

export const MySQLCredentialsSchema = v.object({
  name: v.string(),
  type: v.union([v.literal('mysql'), v.literal('mariadb')]),
  host: v.string(),
  port: v.pipe(
    v.number(),
    v.minValue(1, 'Port must be greater than 0'),
    v.maxValue(65535, 'Port must be less than or equal to 65535')
  ),
  username: v.string(),
  password: v.string(),
  default_database: v.string()
});

export type MySQLCredentials = v.InferOutput<typeof MySQLCredentialsSchema>;

export const BigQueryCredentialsSchema = v.object({
  name: v.string(),
  type: v.literal('bigquery'),
  service_role_key: v.string('Service role key is required'),
  default_project_id: v.string('Project ID is required'),
  default_dataset_id: v.string('Dataset ID is required')
});

export type BigQueryCredentials = v.InferOutput<typeof BigQueryCredentialsSchema>;

export const RedshiftCredentialsSchema = v.object({
  name: v.string(),
  type: v.literal('redshift'),
  host: v.string(),
  port: v.pipe(
    v.number(),
    v.minValue(1, 'Port must be greater than 0'),
    v.maxValue(65535, 'Port must be less than or equal to 65535')
  ),
  username: v.string(),
  password: v.string(),
  default_database: v.string(),
  default_schema: v.string()
});

export type RedshiftCredentials = v.InferOutput<typeof RedshiftCredentialsSchema>;

export const SnowflakeCredentialsSchema = v.object({
  name: v.string(),
  type: v.literal('snowflake'),
  account_id: v.string('Account ID is required'),
  warehouse_id: v.string('Warehouse ID is required'),
  username: v.string(),
  password: v.string(),
  role: v.nullable(v.string()),
  default_database: v.string(),
  default_schema: v.string()
});

export type SnowflakeCredentials = v.InferOutput<typeof SnowflakeCredentialsSchema>;

export const DatabricksCredentialsSchema = v.object({
  name: v.string(),
  type: v.literal('databricks'),
  host: v.string(),
  api_key: v.string('API key is required'),
  warehouse_id: v.string('Warehouse ID is required'),
  default_catalog: v.string(),
  default_schema: v.string()
});

export type DatabricksCredentials = v.InferOutput<typeof DatabricksCredentialsSchema>;

export const SQLServerCredentialsSchema = v.object({
  name: v.string(),
  type: v.literal('sqlserver'),
  host: v.string(),
  port: v.pipe(
    v.number(),
    v.minValue(1, 'Port must be greater than 0'),
    v.maxValue(65535, 'Port must be less than or equal to 65535')
  ),
  username: v.string(),
  password: v.string(),
  default_database: v.string(),
  default_schema: v.string()
});

export type SQLServerCredentials = v.InferOutput<typeof SQLServerCredentialsSchema>;

export const DataSetSchema = v.object({
  id: v.string('Dataset ID is required'),
  name: v.string('Dataset name is required')
});

export const CreatedBySchema = v.object({
  email: v.string('Email is required'),
  id: v.string('User ID is required'),
  name: v.string('User name is required')
});

export const DataSourceSchema = v.object({
  created_at: v.pipe(
    v.string(),
    v.regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+Z$/, 'Invalid ISO date format')
  ),
  created_by: CreatedBySchema,
  credentials: v.union([
    PostgresCredentialsSchema,
    MySQLCredentialsSchema,
    BigQueryCredentialsSchema,
    RedshiftCredentialsSchema,
    SnowflakeCredentialsSchema,
    DatabricksCredentialsSchema,
    SQLServerCredentialsSchema
  ]),
  data_sets: v.array(DataSetSchema),
  id: v.string('Data source ID is required'),
  name: v.string('Data source name is required'),
  type: v.enum(DataSourceTypes),
  updated_at: v.pipe(
    v.string(),
    v.regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+Z$/, 'Invalid ISO date format')
  )
});

export type DataSource = v.InferOutput<typeof DataSourceSchema>;

export interface DataSourceListItem {
  name: string;
  id: string;
  type: DataSourceTypes;
  updated_at: string;
}
