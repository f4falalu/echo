export interface BusterUserDatasetGroup {
  id: string;
  name: string;
  user_id: string;
}

export interface BusterUserDataset {
  id: string;
  name: string;
  user_id: string;
}

export interface BusterUserAttribute {
  id: string;
  name: string;
  user_id: string;
}

export interface BusterUserTeamListItem {
  id: string;
  name: string;
  user_id: string;
}

export interface BusterUserPermissionGroup {
  id: string;
  dataset_count: number;
  assigned: boolean;
  name: string;
}
