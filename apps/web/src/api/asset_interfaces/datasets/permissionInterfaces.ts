export interface ListPermissionGroupsResponse {
  id: string;
  name: string;
  assigned: boolean;
}

export interface ListPermissionUsersResponse {
  id: string;
  name: string;
  email: string;
  assigned: boolean;
  avatar_url: string | null;
}

export interface DatasetPermissionOverviewUser {
  id: string;
  name: string;
  email: string;
  can_query: boolean;
  avatar_url: string | null;
  lineage: {
    name: string;
    id: string;
    type: 'user' | 'datasets' | 'permissionGroups' | 'datasetGroups';
  }[][];
}

export interface DatasetPermissionsOverviewResponse {
  dataset_id: string;
  users: DatasetPermissionOverviewUser[];
}

export interface ListDatasetGroupsResponse {
  id: string;
  name: string;
  assigned: boolean;
}
