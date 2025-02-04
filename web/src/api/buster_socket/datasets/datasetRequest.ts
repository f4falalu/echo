import { BusterSocketRequestBase } from '../base_interfaces';

/**
 * Request payload for listing datasets with pagination and filtering options.
 * @interface DatasetListEmitPayload
 * @extends {BusterSocketRequestBase<'/datasets/list', ListPayload>}
 */
export type DatasetListEmitPayload = BusterSocketRequestBase<
  '/datasets/list',
  {
    /** Current page number */
    page: number;
    /** Number of items per page */
    page_size: number;
    /** Whether to view in admin mode - if true it will show all datasets assosciated with the organization*/
    admin_view: boolean;
    /** Filter by enabled status */
    enabled?: boolean;
    /** Filter by import status */
    imported?: boolean;
    /** Filter by permission group ID */
    permission_group_id?: string;
    /** Filter by ownership of the current user */
    belongs_to?: boolean | null;
  }
>;

/**
 * Request payload for retrieving a specific dataset by ID.
 * @interface DatasetGetEmit
 * @extends {BusterSocketRequestBase<'/datasets/get', GetPayload>}
 */
export type DatasetGetEmit = BusterSocketRequestBase<
  '/datasets/get',
  {
    /** Unique identifier of the dataset */
    id: string;
  }
>;

/**
 * Request payload for creating a new dataset.
 * @interface DatasetPostEmit
 * @extends {BusterSocketRequestBase<'/datasets/post', PostPayload>}
 */
export type DatasetPostEmit = BusterSocketRequestBase<
  '/datasets/post',
  {
    /** Optional name for the dataset */
    name?: string;
    /** ID of the data source to associate with the dataset */
    data_source_id: string;
    /** Optional dataset identifier */
    dataset_id?: string;
  }
>;

/**
 * Request payload for deleting multiple datasets.
 * @interface DatasetDeleteEmit
 * @extends {BusterSocketRequestBase<'/datasets/delete', DeletePayload>}
 */
export type DatasetDeleteEmit = BusterSocketRequestBase<
  '/datasets/delete',
  {
    /** Array of dataset IDs to delete */
    ids: string[];
  }
>;

/**
 * Request payload for updating a dataset's properties.
 * @interface DatasetUpdateEmit
 * @extends {BusterSocketRequestBase<'/datasets/update', UpdatePayload>}
 */
export type DatasetUpdateEmit = BusterSocketRequestBase<
  '/datasets/update',
  {
    /** Unique identifier of the dataset to update */
    id: string;
    /** Whether the dataset is enabled */
    enabled?: boolean;
    /** Usage guidelines for when to use this dataset */
    when_to_use?: string;
    /** Usage guidelines for when not to use this dataset */
    when_not_to_use?: string;
    /** Updated name for the dataset */
    name?: string;
    /** Dataset definition configuration */
    dataset_definition?: {
      /** SQL query for the dataset */
      sql: string;
      /** Database schema name */
      schema: string;
      /** Dataset identifier */
      identifier: string;
      /** Type of the dataset view */
      type: 'view' | 'materializedView';
    };
    /** Updated data source ID */
    data_source_id?: string;
  }
>;

/**
 * Request payload for updating a dataset column's properties.
 * @interface DatasetUpdateColumnEmit
 * @extends {BusterSocketRequestBase<'/datasets/column/update', UpdateColumnPayload>}
 */
export type DatasetUpdateColumnEmit = BusterSocketRequestBase<
  '/datasets/column/update',
  {
    /** Unique identifier of the column to update */
    id: string;
    /** Updated description for the column */
    description?: string;
    /** Whether to store values for this column */
    stored_values?: boolean;
  }
>;

/**
 * Union type of all dataset-related socket emit types.
 * @type {DatasetEmits}
 */
export type DatasetEmits =
  | DatasetListEmitPayload
  | DatasetGetEmit
  | DatasetPostEmit
  | DatasetDeleteEmit
  | DatasetUpdateEmit
  | DatasetUpdateColumnEmit;
