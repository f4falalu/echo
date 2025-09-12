import { findShortcutByName } from '@buster/database';
import { ChatError, ChatErrorCode } from '@buster/server-shared/chats';

/**
 * Parse a message to check if it starts with a shortcut pattern
 * @param message The user's message
 * @returns Object with shortcut name and additional context
 */
export function parseShortcutFromMessage(message: string): {
  shortcutName: string | null;
  additionalContext: string;
} {
  // Match lowercase shortcut names with hyphens (e.g., /weekly-report)
  const match = message.match(/^\/([a-z][a-z0-9-]*)\s?(.*)/);

  if (!match) {
    return { shortcutName: null, additionalContext: message };
  }

  return {
    shortcutName: match[1] ?? null,
    additionalContext: match[2] || '',
  };
}

/**
 * Enhance a message with shortcut instructions
 * @param message The original message
 * @param userId The user's ID
 * @param organizationId The organization's ID
 * @returns Enhanced message with shortcut instructions
 */
export async function enhanceMessageWithShortcut(
  message: string,
  userId: string,
  organizationId: string
): Promise<string> {
  const { shortcutName, additionalContext } = parseShortcutFromMessage(message);

  if (!shortcutName) {
    return message;
  }

  const shortcut = await findShortcutByName({
    name: shortcutName,
    userId,
    organizationId,
  });

  if (!shortcut) {
    throw new ChatError(ChatErrorCode.INVALID_REQUEST, `Shortcut /${shortcutName} not found`, 404);
  }

  // Simply concatenate instructions with any additional context
  return additionalContext
    ? `${shortcut.instructions} ${additionalContext}`
    : shortcut.instructions;
}
