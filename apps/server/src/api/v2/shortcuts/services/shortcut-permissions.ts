import type { User } from '@buster/database';
import type { Shortcut } from '@buster/server-shared/shortcuts';

export type UserOrganizationRole =
  | 'workspace_admin'
  | 'data_admin'
  | 'querier'
  | 'restricted_querier'
  | 'viewer';

export interface UserOrganization {
  organizationId: string;
  role: UserOrganizationRole;
}

/**
 * Check if a user can create workspace shortcuts
 */
export function canCreateWorkspaceShortcut(userOrg: UserOrganization): boolean {
  return userOrg.role === 'workspace_admin' || userOrg.role === 'data_admin';
}

/**
 * Check if a user can modify a shortcut (update)
 */
export function canModifyShortcut(
  user: User,
  shortcut: Shortcut,
  userOrg: UserOrganization
): boolean {
  // Check organization match
  if (shortcut.organizationId !== userOrg.organizationId) {
    return false;
  }

  // Personal shortcuts can only be modified by creator
  if (!shortcut.shareWithWorkspace) {
    return shortcut.createdBy === user.id;
  }

  // Workspace shortcuts can be modified by admins or creator
  const isAdmin = canCreateWorkspaceShortcut(userOrg);
  const isCreator = shortcut.createdBy === user.id;

  return isAdmin || isCreator;
}

/**
 * Check if a user can delete a shortcut
 */
export function canDeleteShortcut(
  user: User,
  shortcut: Shortcut,
  userOrg: UserOrganization
): boolean {
  // Same logic as modify for now, but kept separate for future flexibility
  return canModifyShortcut(user, shortcut, userOrg);
}

/**
 * Check if a user can change shortcut sharing settings
 */
export function canChangeSharing(userOrg: UserOrganization): boolean {
  return canCreateWorkspaceShortcut(userOrg);
}

/**
 * Check if a user can view a shortcut
 */
export function canViewShortcut(
  user: User,
  shortcut: Shortcut,
  userOrg: UserOrganization
): boolean {
  // Check organization match
  if (shortcut.organizationId !== userOrg.organizationId) {
    return false;
  }

  // Workspace shortcuts are visible to all in organization
  if (shortcut.shareWithWorkspace) {
    return true;
  }

  // Personal shortcuts only visible to creator
  return shortcut.createdBy === user.id;
}
