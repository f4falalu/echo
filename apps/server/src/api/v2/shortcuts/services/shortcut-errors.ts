import { HTTPException } from 'hono/http-exception';

export enum ShortcutErrorCode {
  DUPLICATE_NAME = 'SHORTCUT_DUPLICATE_NAME',
  NOT_FOUND = 'SHORTCUT_NOT_FOUND',
  PERMISSION_DENIED = 'SHORTCUT_PERMISSION_DENIED',
  INVALID_NAME_FORMAT = 'SHORTCUT_INVALID_NAME_FORMAT',
  ORGANIZATION_REQUIRED = 'SHORTCUT_ORGANIZATION_REQUIRED',
  CONCURRENT_UPDATE = 'SHORTCUT_CONCURRENT_UPDATE',
  TRANSACTION_FAILED = 'SHORTCUT_TRANSACTION_FAILED',
}

// Removed base ShortcutError class - each error extends HTTPException directly

/**
 * Error thrown when a shortcut with the same name already exists
 */
export class DuplicateShortcutError extends HTTPException {
  public code: ShortcutErrorCode;

  constructor(name: string, scope: 'personal' | 'workspace') {
    const scopeText = scope === 'workspace' ? 'workspace' : 'your personal shortcuts';
    super(409, {
      message: `A shortcut named '${name}' already exists in ${scopeText}`,
    });
    this.code = ShortcutErrorCode.DUPLICATE_NAME;
  }
}

/**
 * Error thrown when user lacks permission for an operation
 */
export class ShortcutPermissionError extends HTTPException {
  public code: ShortcutErrorCode;

  constructor(operation: 'create' | 'update' | 'delete' | 'view', details?: string) {
    const message = details
      ? `You do not have permission to ${operation} this shortcut: ${details}`
      : `You do not have permission to ${operation} this shortcut`;
    super(403, { message });
    this.code = ShortcutErrorCode.PERMISSION_DENIED;
  }
}

/**
 * Error thrown when a shortcut is not found
 */
export class ShortcutNotFoundError extends HTTPException {
  public code: ShortcutErrorCode;

  constructor(identifier?: string) {
    const message = identifier ? `Shortcut '${identifier}' not found` : 'Shortcut not found';
    super(404, { message });
    this.code = ShortcutErrorCode.NOT_FOUND;
  }
}

/**
 * Error thrown when shortcut name format is invalid
 */
export class InvalidShortcutNameError extends HTTPException {
  public code: ShortcutErrorCode;

  constructor(name: string) {
    super(400, {
      message: `Invalid shortcut name '${name}'. Names must start with a lowercase letter and contain only lowercase letters, numbers, and hyphens`,
    });
    this.code = ShortcutErrorCode.INVALID_NAME_FORMAT;
  }
}

/**
 * Error thrown when user is not part of an organization
 */
export class OrganizationRequiredError extends HTTPException {
  public code: ShortcutErrorCode;

  constructor() {
    super(400, { message: 'User must belong to an organization' });
    this.code = ShortcutErrorCode.ORGANIZATION_REQUIRED;
  }
}

/**
 * Error thrown when concurrent update conflicts occur
 */
export class ConcurrentUpdateError extends HTTPException {
  public code: ShortcutErrorCode;

  constructor(shortcutName: string) {
    super(409, {
      message: `The shortcut '${shortcutName}' was modified by another user. Please refresh and try again`,
    });
    this.code = ShortcutErrorCode.CONCURRENT_UPDATE;
  }
}

/**
 * Error thrown when a database transaction fails
 */
export class TransactionError extends HTTPException {
  public code: ShortcutErrorCode;

  constructor(operation: string) {
    super(500, {
      message: `Failed to ${operation} shortcut due to a transaction error. Please try again`,
    });
    this.code = ShortcutErrorCode.TRANSACTION_FAILED;
  }
}
