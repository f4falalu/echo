import type { User } from '@buster/database';
import { deleteShortcut, getShortcutById, getUserOrganizationId } from '@buster/database';
import { HTTPException } from 'hono/http-exception';

export async function deleteShortcutHandler(
  user: User,
  shortcutId: string
): Promise<{ success: boolean }> {
  try {
    // Get user's organization ID
    const userOrg = await getUserOrganizationId(user.id);

    if (!userOrg) {
      throw new HTTPException(400, {
        message: 'User must belong to an organization',
      });
    }

    const { organizationId } = userOrg;

    // Get the existing shortcut
    const existingShortcut = await getShortcutById({ id: shortcutId });

    if (!existingShortcut) {
      throw new HTTPException(404, {
        message: 'Shortcut not found',
      });
    }

    // Check permissions
    if (existingShortcut.organizationId !== organizationId) {
      throw new HTTPException(403, {
        message: 'You do not have permission to delete this shortcut',
      });
    }

    // For personal shortcuts, only creator can delete
    // For workspace shortcuts, check admin permission (TODO)
    if (!existingShortcut.sharedWithWorkspace && existingShortcut.createdBy !== user.id) {
      throw new HTTPException(403, {
        message: 'You can only delete your own shortcuts',
      });
    }

    if (existingShortcut.sharedWithWorkspace) {
      // TODO: Check if user is admin/has permission to delete workspace shortcuts
      // For now, we'll allow the creator to delete their workspace shortcuts
      if (existingShortcut.createdBy !== user.id) {
        throw new HTTPException(403, {
          message: 'Only administrators can delete workspace shortcuts',
        });
      }
    }

    // Soft delete the shortcut
    await deleteShortcut({
      id: shortcutId,
      deletedBy: user.id,
    });

    return { success: true };
  } catch (error) {
    console.error('Error in deleteShortcutHandler:', {
      userId: user.id,
      shortcutId,
      error: error instanceof Error ? error.message : error,
    });

    if (error instanceof HTTPException) {
      throw error;
    }

    throw new HTTPException(500, {
      message: 'Failed to delete shortcut',
    });
  }
}
