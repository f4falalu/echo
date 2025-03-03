/**
 * Parameters for fetching datasets with optional filtering and pagination.
 */
export interface GetDatasetsParams {
  /** Current page number */
  page?: number;
  /** Number of items to display per page */
  page_size?: number;
  /** Search term to filter datasets */
  search?: string;
  /** When true, returns admin view of datasets */
  admin_view?: boolean;
  /** When true, returns only imported datasets */
  imported?: boolean;
  /** When true, returns only enabled datasets */
  enabled?: boolean;
  /** Filter by permission group ID */
  permission_group_id?: string;
  /** Filter by owner */
  belongs_to?: string;
}

/**
 * Parameters for creating a new dataset.
 */
export interface CreateDatasetParams {
  /** The name of the dataset */
  name: string;
  /** The ID of the data source */
  data_source_id: string;
}

/**
 * Parameters for deploying a dataset.
 */
export interface DeployDatasetParams {
  /** The ID of the dataset to deploy */
  dataset_id: string;
  /** SQL query for the dataset */
  sql: string;
  /** YML configuration for the dataset */
  yml: string;
}
