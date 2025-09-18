import type { User } from '@buster/database/queries';
import { getShortcutById, getUserOrganizationId } from '@buster/database/queries';
import type { Shortcut } from '@buster/server-shared/shortcuts';
import { HTTPException } from 'hono/http-exception';

export async function getShortcutHandler(user: User, shortcutId: string): Promise<Shortcut> {
  try {
    // Get user's organization ID
    const userOrg = await getUserOrganizationId(user.id);

    if (!userOrg) {
      throw new HTTPException(400, {
        message: 'User must belong to an organization',
      });
    }

    const { organizationId } = userOrg;

    const shortcut = await getShortcutById({ id: shortcutId });

    if (!shortcut) {
      throw new HTTPException(404, {
        message: 'Shortcut not found',
      });
    }

    // Check permissions: user must be creator or shortcut must be workspace-shared
    if (
      shortcut.organizationId !== organizationId ||
      (!shortcut.shareWithWorkspace && shortcut.createdBy !== user.id)
    ) {
      throw new HTTPException(403, {
        message: 'You do not have permission to view this shortcut',
      });
    }

    return shortcut;
  } catch (error) {
    console.error('Error in getShortcutHandler:', {
      userId: user.id,
      shortcutId,
      error: error instanceof Error ? error.message : error,
    });

    if (error instanceof HTTPException) {
      throw error;
    }

    throw new HTTPException(500, {
      message: 'Failed to fetch shortcut',
    });
  }
}
