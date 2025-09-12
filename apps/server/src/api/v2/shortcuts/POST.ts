import type { User } from '@buster/database';
import { checkDuplicateName, createShortcut, getUserOrganizationId } from '@buster/database';
import type { CreateShortcutRequest, Shortcut } from '@buster/server-shared/shortcuts';
import { HTTPException } from 'hono/http-exception';

export async function createShortcutHandler(
  user: User,
  data: CreateShortcutRequest
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

    // Check if user has permission to create workspace shortcuts
    if (data.shareWithWorkspace) {
      // Only workspace_admin or data_admin can create workspace shortcuts
      if (userOrg.role !== 'workspace_admin' && userOrg.role !== 'data_admin') {
        throw new HTTPException(403, {
          message: 'Only workspace admins and data admins can create workspace shortcuts',
        });
      }
    }

    // Check for duplicate name
    const isDuplicate = await checkDuplicateName({
      name: data.name,
      userId: user.id,
      organizationId,
      isWorkspace: data.shareWithWorkspace,
    });

    if (isDuplicate) {
      const scope = data.shareWithWorkspace ? 'workspace' : 'your personal shortcuts';
      throw new HTTPException(409, {
        message: `A shortcut named '${data.name}' already exists in ${scope}`,
      });
    }

    // Create the shortcut
    const shortcut = await createShortcut({
      name: data.name,
      instructions: data.instructions,
      createdBy: user.id,
      organizationId,
      shareWithWorkspace: data.shareWithWorkspace,
    });

    if (!shortcut) {
      throw new HTTPException(500, {
        message: 'Failed to create shortcut',
      });
    }

    return shortcut;
  } catch (error) {
    console.error('Error in createShortcutHandler:', {
      userId: user.id,
      data,
      error: error instanceof Error ? error.message : error,
    });

    if (error instanceof HTTPException) {
      throw error;
    }

    throw new HTTPException(500, {
      message: 'Failed to create shortcut',
    });
  }
}
