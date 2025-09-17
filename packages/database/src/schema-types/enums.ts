// Type definitions for database enums

export type AssetType = 'chat' | 'metric_file' | 'dashboard_file' | 'report_file' | 'collection';

export type AssetPermissionRole =
  | 'owner'
  | 'viewer'
  | 'can_view'
  | 'can_filter'
  | 'can_edit'
  | 'full_access';

export type IdentityType = 'user' | 'team' | 'organization';

export type WorkspaceSharing = 'none' | 'can_view' | 'can_edit' | 'full_access';

export type UserOrganizationRole =
  | 'workspace_admin'
  | 'data_admin'
  | 'querier'
  | 'restricted_querier'
  | 'viewer';
