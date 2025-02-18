export interface CreateDatasetGroupRequest {
  name: string;
}

export interface UpdateDatasetGroupRequest {
  id: string;
  name: string;
}

export interface UpdateDatasetGroupAssignmentRequest {
  id: string;
  assigned: boolean;
}

export type UpdateDatasetGroupUsersRequest = UpdateDatasetGroupAssignmentRequest[];
export type UpdateDatasetGroupDatasetsRequest = UpdateDatasetGroupAssignmentRequest[];
export type UpdateDatasetGroupPermissionGroupsRequest = UpdateDatasetGroupAssignmentRequest[];
