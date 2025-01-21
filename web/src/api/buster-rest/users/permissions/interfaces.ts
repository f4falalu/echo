import { TeamRole } from '../interfaces';

export interface BusterUserDatasetGroup {
  id: string;
  name: string;
  permission_count: number;
  assigned: boolean;
}

export interface BusterUserDataset {
  id: string;
  name: string;
  user_id: string;
  assigned: boolean;
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
  role: TeamRole;
}

export interface BusterUserPermissionGroup {
  id: string;
  dataset_count: number;
  assigned: boolean;
  name: string;
}
