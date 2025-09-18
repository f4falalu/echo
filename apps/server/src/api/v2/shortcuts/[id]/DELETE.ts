import type { User } from '@buster/database/queries';
import { deleteShortcut, getShortcutById, getUserOrganizationId } from '@buster/database/queries';
import {
  OrganizationRequiredError,
  ShortcutNotFoundError,
  ShortcutPermissionError,
} from '../services/shortcut-errors';
import { canDeleteShortcut } from '../services/shortcut-permissions';

export async function deleteShortcutHandler(
  user: User,
  shortcutId: string
): Promise<{ success: boolean }> {
  try {
    // Get user's organization ID
    const userOrg = await getUserOrganizationId(user.id);

    if (!userOrg) {
      throw new OrganizationRequiredError();
    }

    const { organizationId, role } = userOrg;

    // Get the existing shortcut
    const existingShortcut = await getShortcutById({ id: shortcutId });

    if (!existingShortcut) {
      throw new ShortcutNotFoundError(shortcutId);
    }

    // Use centralized permission check
    if (!canDeleteShortcut(user, existingShortcut, { organizationId, role })) {
      const details = existingShortcut.shareWithWorkspace
        ? 'Only workspace admins, data admins, or the shortcut creator can delete workspace shortcuts'
        : 'You can only delete your own shortcuts';
      throw new ShortcutPermissionError('delete', details);
    }

    // Soft delete the shortcut
    const result = await deleteShortcut({
      id: shortcutId,
      deletedBy: user.id,
    });

    if (!result) {
      throw new Error('Failed to delete shortcut');
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteShortcutHandler:', {
      userId: user.id,
      shortcutId,
      error: error instanceof Error ? error.message : error,
    });

    // Re-throw our custom errors
    if (
      error instanceof OrganizationRequiredError ||
      error instanceof ShortcutNotFoundError ||
      error instanceof ShortcutPermissionError
    ) {
      throw error;
    }

    // Generic error fallback
    throw new Error('Failed to delete shortcut');
  }
}
