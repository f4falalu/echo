import type { DatasourceCreateCredentials } from '../../buster_socket/datasources/interface';

export interface DatasourceListParams {
  /** The page number for pagination */
  page: number;
  /** Number of items per page */
  page_size: number;
}

export interface DatasourceGetParams {
  /** Unique identifier of the data source */
  id: string;
}

export interface DatasourceDeleteParams {
  /** Unique identifier of the data source to delete */
  id: string;
}

export interface DatasourcePostParams {
  /** Name of the data source */
  name: string;
  /** Type of the data source */
  type: string;
  /** Authentication credentials for the data source */
  credentials: DatasourceCreateCredentials;
}

export interface DatasourceUpdateParams {
  /** Unique identifier of the data source to update */
  id: string;
  /** Optional new name for the data source */
  name?: string;
  /** Optional new type for the data source */
  type?: string;
  /** Updated authentication credentials */
  credentials: DatasourceCreateCredentials;
}
