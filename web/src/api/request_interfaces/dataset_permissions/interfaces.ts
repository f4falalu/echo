export interface ListIndividualDatasetPermissionGroupsParams {
  dataset_id: string;
}

export interface ListDatasetDatasetGroupsParams {
  dataset_id: string;
}

export interface ListDatasetPermissionUsersParams {
  dataset_id: string;
}

export interface UpdateDatasetPermissionUsersParams {
  dataset_id: string;
  users: {
    id: string;
    assigned: boolean;
  }[];
}

export interface GetDatasetPermissionsOverviewParams {
  dataset_id: string;
}
