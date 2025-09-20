import type { User } from '@buster/database/queries';
import { createShortcut, getUserOrganizationId } from '@buster/database/queries';
import type { CreateShortcutRequest, Shortcut } from '@buster/server-shared/shortcuts';
import {
  DuplicateShortcutError,
  InvalidShortcutNameError,
  OrganizationRequiredError,
  ShortcutPermissionError,
  TransactionError,
} from './services/shortcut-errors';
import { canCreateWorkspaceShortcut } from './services/shortcut-permissions';
import { validateInstructions, validateShortcutName } from './services/shortcut-validators';

export async function createShortcutHandler(
  user: User,
  data: CreateShortcutRequest
): Promise<Shortcut> {
  try {
    // Validate shortcut name format
    validateShortcutName(data.name);

    // Validate instructions
    const sanitizedInstructions = validateInstructions(data.instructions);

    // Get user's organization ID
    const userOrg = await getUserOrganizationId(user.id);

    if (!userOrg) {
      throw new OrganizationRequiredError();
    }

    const { organizationId, role } = userOrg;

    // Check if user has permission to create workspace shortcuts
    if (data.shareWithWorkspace && !canCreateWorkspaceShortcut({ organizationId, role })) {
      throw new ShortcutPermissionError(
        'create',
        'Only workspace admins and data admins can create workspace shortcuts'
      );
    }

    // Create the shortcut (transaction-based with duplicate checking)
    try {
      const shortcut = await createShortcut({
        name: data.name,
        instructions: sanitizedInstructions,
        createdBy: user.id,
        organizationId,
        shareWithWorkspace: data.shareWithWorkspace ?? false,
      });

      if (!shortcut) {
        throw new Error('Failed to create shortcut');
      }

      return shortcut;
    } catch (error) {
      // Handle duplicate name error from transaction
      if (error instanceof Error && error.message.includes('already exists')) {
        const scope = data.shareWithWorkspace ? 'workspace' : 'personal';
        throw new DuplicateShortcutError(data.name, scope);
      }
      throw error;
    }
  } catch (error) {
    console.error('Error in createShortcutHandler:', {
      userId: user.id,
      data: { ...data, instructions: `${data.instructions.substring(0, 100)}...` }, // Truncate for logging
      error: error instanceof Error ? error.message : error,
    });

    // Re-throw our custom errors
    if (
      error instanceof InvalidShortcutNameError ||
      error instanceof OrganizationRequiredError ||
      error instanceof ShortcutPermissionError ||
      error instanceof DuplicateShortcutError ||
      error instanceof TransactionError
    ) {
      throw error;
    }

    // Generic error fallback
    throw new TransactionError('create');
  }
}
