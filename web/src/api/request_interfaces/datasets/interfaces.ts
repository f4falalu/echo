/**
 * Interface for dataset list request payload
 */
export interface DatasetListPayload {
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

/**
 * Interface for getting a specific dataset
 */
export interface DatasetGetPayload {
  /** Unique identifier of the dataset */
  id: string;
}

/**
 * Interface for creating a new dataset
 */
export interface DatasetPostPayload {
  /** Optional name for the dataset */
  name?: string;
  /** ID of the data source to associate with the dataset */
  data_source_id: string;
  /** Optional dataset identifier */
  dataset_id?: string;
}

/**
 * Interface for deleting datasets
 */
export interface DatasetDeletePayload {
  /** Array of dataset IDs to delete */
  ids: string[];
}

/**
 * Interface for updating a dataset
 */
export interface DatasetUpdatePayload {
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

/**
 * Interface for updating a dataset column
 */
export interface DatasetUpdateColumnPayload {
  /** Unique identifier of the column to update */
  id: string;
  /** Updated description for the column */
  description?: string;
  /** Whether to store values for this column */
  stored_values?: boolean;
}
