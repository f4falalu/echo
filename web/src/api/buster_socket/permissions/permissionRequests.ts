import type { BusterOrganizationRole } from '../../asset_interfaces';
import type { BusterSocketRequestBase } from '../base_interfaces';
import type { BusterPermissionUser } from '@/api/asset_interfaces';

/**
 * Request to list users with pagination and optional filtering
 * @param page Current page number
 * @param page_size Number of items per page
 * @param team_id Optional team ID to filter users
 * @param permission_group_id Optional permission group ID to filter users
 * @param belongs_to Optional boolean to filter by belonging status
 */
export type PermissionsListUsersRequest = BusterSocketRequestBase<
  '/permissions/users/list',
  {
    /** Current page number */
    page: number;
    /** Number of items per page */
    page_size: number;
    /** Optional team ID to filter users */
    team_id?: string;
    /** Optional permission group ID to filter users */
    permission_group_id?: string;
    /** Optional boolean to filter by belonging status */
    belongs_to?: boolean | null;
  }
>;

/**
 * Request to get a specific user's permissions
 * @param id User ID to retrieve
 */
export type PermissionUserRequest = BusterSocketRequestBase<
  '/permissions/users/get',
  {
    /** User ID to retrieve */
    id: string;
  }
>;

/**
 * Request to update a user's permissions and settings
 * @param id User ID to update
 * @param sharing_setting Optional sharing settings configuration
 * @param edit_sql Optional permission to edit SQL
 * @param upload_csv Optional permission to upload CSV files
 * @param export_assets Optional permission to export assets
 * @param email_slack_enabled Optional setting for email/slack notifications
 * @param teams Optional array of team assignments with roles
 * @param permission_groups Optional array of permission group IDs
 * @param name Optional user name
 */
export type PermissionUserUpdateRequest = BusterSocketRequestBase<
  '/permissions/users/update',
  {
    /** User ID to update */
    id: string;
    /** Optional sharing settings configuration */
    sharing_setting?: BusterPermissionUser['sharing_setting'];
    /** Optional permission to edit SQL */
    edit_sql?: boolean;
    /** Optional permission to upload CSV files */
    upload_csv?: boolean;
    /** Optional permission to export assets */
    export_assets?: boolean;
    /** Optional setting for email/slack notifications */
    email_slack_enabled?: boolean;
    /** Optional array of team assignments with roles */
    teams?: {
      /** Team ID */
      id: string;
      /** Organization role for the team */
      role: BusterOrganizationRole;
    }[];
    /** Optional array of permission group IDs */
    permission_groups?: string[];
    /** Optional user name */
    name?: string;
  }
>;

/**
 * Request to get a specific permission group
 * @param id Permission group ID to retrieve
 */
export type PermissionGetPermissionGroup = BusterSocketRequestBase<
  '/permissions/groups/get',
  {
    /** Permission group ID to retrieve */
    id: string;
  }
>;

/**
 * Request to list permission groups with pagination and filtering
 * @param page Current page number
 * @param page_size Number of items per page
 * @param team_id Optional team ID to filter groups
 * @param user_id Optional user ID to filter groups
 * @param belongs_to Optional boolean to filter by belonging status
 */
export type PermissionsListGroupRequest = BusterSocketRequestBase<
  '/permissions/groups/list',
  {
    /** Current page number */
    page: number;
    /** Number of items per page */
    page_size: number;
    /** Optional team ID to filter groups */
    team_id?: string;
    /** Optional user ID to filter groups */
    user_id?: string;
    /** Optional boolean to filter by belonging status */
    belongs_to?: boolean | null;
  }
>;

/**
 * Request to create a new permission group
 * @param name Name of the new permission group
 */
export type PermissionPostGroupRequest = BusterSocketRequestBase<
  '/permissions/groups/post',
  {
    /** Name of the new permission group */
    name: string;
  }
>;

/**
 * Request to get a specific team's permissions
 * @param id Team ID to retrieve
 */
export type PermissionGetPermissionTeam = BusterSocketRequestBase<
  '/permissions/teams/get',
  {
    /** Team ID to retrieve */
    id: string;
  }
>;

/**
 * Request to update a permission group
 * @param id Permission group ID to update
 * @param name Optional new name for the group
 * @param users Optional array of user IDs (null for no changes, empty to clear)
 * @param teams Optional array of team IDs (null for no changes, empty to clear)
 * @param datasets Optional array of dataset IDs (null for no changes, empty to clear)
 */
export type PermissionGroupUpdateRequest = BusterSocketRequestBase<
  '/permissions/groups/update',
  {
    /** Permission group ID to update */
    id: string;
    /** Optional new name for the group */
    name?: string;
    /** Optional array of user IDs (null for no changes, empty to clear) */
    users?: null | string[];
    /** Optional array of team IDs (null for no changes, empty to clear) */
    teams?: string[];
    /** Optional array of dataset IDs (null for no changes, empty to clear) */
    datasets?: string[];
  }
>;

/**
 * Request to list teams with pagination and filtering
 * @param page Current page number
 * @param page_size Number of items per page
 * @param user_id Optional user ID to filter teams
 * @param permission_group_id Optional permission group ID to filter teams
 * @param belongs_to Optional boolean to filter by belonging status
 */
export type PermissionListTeamRequest = BusterSocketRequestBase<
  '/permissions/teams/list',
  {
    /** Current page number */
    page: number;
    /** Number of items per page */
    page_size: number;
    /** Optional user ID to filter teams */
    user_id?: string;
    /** Optional permission group ID to filter teams */
    permission_group_id?: string;
    /** Optional boolean to filter by belonging status */
    belongs_to?: boolean | null;
  }
>;

/**
 * Request to create a new team
 * @param name Name of the new team
 * @param description Optional description of the team
 */
export type PermissionPostTeamRequest = BusterSocketRequestBase<
  '/permissions/teams/post',
  {
    /** Name of the new team */
    name: string;
    /** Optional description of the team */
    description?: string;
  }
>;

/**
 * Request to create a new user
 * @param email Email address of the new user
 * @param role Organization role for the new user
 */
export type PermissionPostUserRequest = BusterSocketRequestBase<
  '/permissions/users/post',
  {
    /** Email address of the new user */
    email: string;
    /** Organization role for the new user */
    role: BusterOrganizationRole;
  }
>;

/**
 * Request to update a team's settings and members
 * @param id Team ID to update
 * @param sharing_setting Optional sharing settings configuration
 * @param edit_sql Optional permission to edit SQL
 * @param upload_csv Optional permission to upload CSV files
 * @param export_assets Optional permission to export assets
 * @param email_slack_enabled Optional setting for email/slack notifications
 * @param teams Optional array of team assignments with roles
 * @param permission_groups Optional array of permission group IDs
 * @param name Optional team name
 * @param users Optional array of user IDs and their roles
 */
export type PermissionTeamUpdateRequest = BusterSocketRequestBase<
  '/permissions/teams/update',
  {
    /** Team ID to update */
    id: string;
    /** Optional sharing settings configuration */
    sharing_setting?: BusterPermissionUser['sharing_setting'];
    /** Optional permission to edit SQL */
    edit_sql?: boolean;
    /** Optional permission to upload CSV files */
    upload_csv?: boolean;
    /** Optional permission to export assets */
    export_assets?: boolean;
    /** Optional setting for email/slack notifications */
    email_slack_enabled?: boolean;
    /** Optional array of team assignments with roles */
    teams?: {
      /** Team ID */
      id: string;
      /** Organization role for the team */
      role: BusterOrganizationRole;
    }[];
    /** Optional array of permission group IDs */
    permission_groups?: string[];
    /** Optional team name */
    name?: string;
    /** Optional array of user IDs and their roles */
    users?: {
      /** User ID */
      id: string;
      /** Organization role for the user */
      role: BusterOrganizationRole;
    }[];
  }
>;

/**
 * Request to delete permission groups
 * @param ids Array of permission group IDs to delete
 */
export type PermissionGroupDeleteRequest = BusterSocketRequestBase<
  '/permissions/groups/delete',
  {
    /** Array of permission group IDs to delete */
    ids: string[];
  }
>;

/**
 * Request to delete teams
 * @param ids Array of team IDs to delete
 */
export type PermissionTeamDeleteRequest = BusterSocketRequestBase<
  '/permissions/teams/delete',
  {
    /** Array of team IDs to delete */
    ids: string[];
  }
>;

/**
 * Union type of all permission-related requests
 */
export type PermissionsEmits =
  | PermissionTeamDeleteRequest
  | PermissionsListUsersRequest
  | PermissionUserRequest
  | PermissionGetPermissionGroup
  | PermissionGetPermissionTeam
  | PermissionsListGroupRequest
  | PermissionListTeamRequest
  | PermissionPostGroupRequest
  | PermissionPostTeamRequest
  | PermissionPostUserRequest
  | PermissionGroupUpdateRequest
  | PermissionUserUpdateRequest
  | PermissionTeamUpdateRequest
  | PermissionGroupDeleteRequest;
