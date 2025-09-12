import type { User } from '@buster/database';
import {
  checkDuplicateName,
  getShortcutById,
  getUserOrganizationId,
  updateShortcut,
} from '@buster/database';
import type { Shortcut, UpdateShortcutRequest } from '@buster/server-shared/shortcuts';
import { HTTPException } from 'hono/http-exception';

export async function updateShortcutHandler(
  user: User,
  shortcutId: string,
  data: UpdateShortcutRequest
): Promise<Shortcut> {
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
        message: 'You do not have permission to update this shortcut',
      });
    }

    // For personal shortcuts, only creator can update
    if (!existingShortcut.sharedWithWorkspace && existingShortcut.createdBy !== user.id) {
      throw new HTTPException(403, {
        message: 'You can only update your own shortcuts',
      });
    }

    // For workspace shortcuts, check admin permission
    if (existingShortcut.sharedWithWorkspace) {
      // Only workspace_admin, data_admin, or the creator can update workspace shortcuts
      const isAdmin = userOrg.role === 'workspace_admin' || userOrg.role === 'data_admin';
      const isCreator = existingShortcut.createdBy === user.id;

      if (!isAdmin && !isCreator) {
        throw new HTTPException(403, {
          message:
            'Only workspace admins, data admins, or the shortcut creator can update workspace shortcuts',
        });
      }
    }

    // If name is being changed, check for duplicates
    if (data.name && data.name !== existingShortcut.name) {
      const isDuplicate = await checkDuplicateName({
        name: data.name,
        userId: user.id,
        organizationId,
        isWorkspace: existingShortcut.sharedWithWorkspace,
        excludeId: shortcutId,
      });

      if (isDuplicate) {
        const scope = existingShortcut.sharedWithWorkspace
          ? 'workspace'
          : 'your personal shortcuts';
        throw new HTTPException(409, {
          message: `A shortcut named '${data.name}' already exists in ${scope}`,
        });
      }
    }

    // Update the shortcut
    const updatedShortcut = await updateShortcut({
      id: shortcutId,
      name: data.name,
      instructions: data.instructions,
      updatedBy: user.id,
    });

    if (!updatedShortcut) {
      throw new HTTPException(500, {
        message: 'Failed to update shortcut',
      });
    }

    return updatedShortcut;
  } catch (error) {
    console.error('Error in updateShortcutHandler:', {
      userId: user.id,
      shortcutId,
      data,
      error: error instanceof Error ? error.message : error,
    });

    if (error instanceof HTTPException) {
      throw error;
    }

    throw new HTTPException(500, {
      message: 'Failed to update shortcut',
    });
  }
}
