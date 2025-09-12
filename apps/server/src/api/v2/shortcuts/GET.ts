import type { User } from '@buster/database';
import { getUserOrganizationId, getUserShortcuts } from '@buster/database';
import type { ListShortcutsResponse } from '@buster/server-shared/shortcuts';
import { HTTPException } from 'hono/http-exception';

export async function listShortcutsHandler(user: User): Promise<ListShortcutsResponse> {
  try {
    // Get user's organization ID
    const userOrg = await getUserOrganizationId(user.id);

    if (!userOrg) {
      throw new HTTPException(400, {
        message: 'User must belong to an organization',
      });
    }

    const { organizationId } = userOrg;

    // Get all accessible shortcuts (personal + workspace) sorted alphabetically
    const shortcuts = await getUserShortcuts({
      userId: user.id,
      organizationId,
    });

    return {
      shortcuts,
    };
  } catch (error) {
    console.error('Error in listShortcutsHandler:', {
      userId: user.id,
      error: error instanceof Error ? error.message : error,
    });

    if (error instanceof HTTPException) {
      throw error;
    }

    throw new HTTPException(500, {
      message: 'Failed to fetch shortcuts',
    });
  }
}
