// Type definitions for database enums
import { z } from 'zod';

export const AssetTypeSchema = z.enum([
  'chat',
  'metric_file',
  'dashboard_file',
  'report_file',
  'collection',
]);
export type AssetType = z.infer<typeof AssetTypeSchema>;

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
