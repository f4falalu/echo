import type { BusterSocketRequestBase } from '../base_interfaces';
import type {
  DatasourceListParams,
  DatasourceGetParams,
  DatasourceDeleteParams,
  DatasourcePostParams,
  DatasourceUpdateParams
} from '../../request_interfaces/datasources/interfaces';

/**
 * Request type for listing data sources with pagination.
 * Endpoint: /data_sources/list
 */
export type DatasourceListRequest = BusterSocketRequestBase<
  '/data_sources/list',
  DatasourceListParams
>;

/**
 * Request type for retrieving a specific data source by ID.
 * Endpoint: /data_sources/get
 */
export type DatasourceGetRequest = BusterSocketRequestBase<
  '/data_sources/get',
  DatasourceGetParams
>;

/**
 * Request type for deleting a specific data source.
 * Endpoint: /data_sources/delete
 */
export type DatasourceDeleteRequest = BusterSocketRequestBase<
  '/data_sources/delete',
  DatasourceDeleteParams
>;

/**
 * Request type for creating a new data source.
 * Endpoint: /data_sources/post
 */
export type DatasourcePostRequest = BusterSocketRequestBase<
  '/data_sources/post',
  DatasourcePostParams
>;

/**
 * Request type for updating an existing data source.
 * Endpoint: /data_sources/update
 */
export type DatasourceUpdateRequest = BusterSocketRequestBase<
  '/data_sources/update',
  DatasourceUpdateParams
>;

/** Union type of all possible data source request types */
export type DatasourceEmits =
  | DatasourceListRequest
  | DatasourceGetRequest
  | DatasourcePostRequest
  | DatasourceUpdateRequest
  | DatasourceDeleteRequest;
