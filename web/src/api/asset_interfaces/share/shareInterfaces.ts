export enum ShareRole {
  OWNER = 'owner',
  EDITOR = 'editor',
  VIEWER = 'viewer'
}

export enum ShareAssetType {
  METRIC = 'metric',
  DASHBOARD = 'dashboard',
  COLLECTION = 'collection'
}

export interface BusterShare {
  sharingKey: string;
  individual_permissions: null | BusterShareIndividual[];
  team_permissions: null | { name: string; id: string; role: ShareRole }[];
  organization_permissions: null | [];
  password_secret_id: string | null;
  public_expiry_date: string | null;
  public_enabled_by: string | null;
  publicly_accessible: boolean;
  public_password: string | null;
  permission: ShareRole; //this is the permission the user has to the thread, dashboard or collection
}

export interface BusterShareIndividual {
  email: string;
  role: ShareRole;
  id: string;
  name: string;
}
