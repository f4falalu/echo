import type { BusterSocketRequestBase } from '../base_interfaces';
import type { DatasourceCreateCredentials } from './interface';

/**
 * Request type for listing data sources with pagination.
 * Endpoint: /data_sources/list
 */
export type DatasourceListRequest = BusterSocketRequestBase<
  '/data_sources/list',
  {
    /** The page number for pagination */
    page: number;
    /** Number of items per page */
    page_size: number;
  }
>;

/**
 * Request type for retrieving a specific data source by ID.
 * Endpoint: /data_sources/get
 */
export type DatasourceGetRequest = BusterSocketRequestBase<
  '/data_sources/get',
  {
    /** Unique identifier of the data source */
    id: string;
  }
>;

/**
 * Request type for deleting a specific data source.
 * Endpoint: /data_sources/delete
 */
export type DatasourceDeleteRequest = BusterSocketRequestBase<
  '/data_sources/delete',
  {
    /** Unique identifier of the data source to delete */
    id: string;
  }
>;

/**
 * Request type for creating a new data source.
 * Endpoint: /data_sources/post
 */
export type DatasourcePostRequest = BusterSocketRequestBase<
  '/data_sources/post',
  {
    /** Name of the data source */
    name: string;
    /** Type of the data source */
    type: string;
    /** Authentication credentials for the data source */
    credentials: DatasourceCreateCredentials;
  }
>;

/**
 * Request type for updating an existing data source.
 * Endpoint: /data_sources/update
 */
export type DatasourceUpdateRequest = BusterSocketRequestBase<
  '/data_sources/update',
  {
    /** Unique identifier of the data source to update */
    id: string;
    /** Optional new name for the data source */
    name?: string;
    /** Optional new type for the data source */
    type?: string;
    /** Updated authentication credentials */
    credentials: DatasourceCreateCredentials;
  }
>;

/** Union type of all possible data source request types */
export type DatasourceEmits =
  | DatasourceListRequest
  | DatasourceGetRequest
  | DatasourcePostRequest
  | DatasourceUpdateRequest
  | DatasourceDeleteRequest;
