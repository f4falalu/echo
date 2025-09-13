import { InvalidShortcutNameError } from './shortcut-errors';

/**
 * Validate shortcut name format
 * @param name The shortcut name to validate
 * @throws InvalidShortcutNameError if the name is invalid
 */
export function validateShortcutName(name: string): void {
  // Check if name starts with lowercase letter and contains only valid characters
  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    throw new InvalidShortcutNameError(name);
  }

  // Check for consecutive hyphens
  if (name.includes('--')) {
    throw new InvalidShortcutNameError(name);
  }

  // Check length constraints
  if (name.length === 0) {
    throw new InvalidShortcutNameError(name);
  }

  if (name.length > 255) {
    throw new InvalidShortcutNameError(name);
  }
}

/**
 * Sanitize and validate instructions
 * @param instructions The instructions to validate
 * @returns Sanitized instructions
 */
export function validateInstructions(instructions: string): string {
  const trimmed = instructions.trim();

  if (trimmed.length === 0) {
    throw new Error('Instructions cannot be empty');
  }

  if (trimmed.length > 10000) {
    throw new Error('Instructions must be 10,000 characters or less');
  }

  return trimmed;
}
