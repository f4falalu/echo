import { describe, expect, it } from 'vitest';
import {
  ConcurrentUpdateError,
  DuplicateShortcutError,
  InvalidShortcutNameError,
  OrganizationRequiredError,
  ShortcutErrorCode,
  ShortcutNotFoundError,
  ShortcutPermissionError,
  TransactionError,
} from './shortcut-errors';

describe('shortcut-errors', () => {
  describe('DuplicateShortcutError', () => {
    it('should create error for personal shortcut duplicate', () => {
      const error = new DuplicateShortcutError('my-shortcut', 'personal');

      expect(error.code).toBe(ShortcutErrorCode.DUPLICATE_NAME);
      expect(error.message).toBe(
        "A shortcut named 'my-shortcut' already exists in your personal shortcuts"
      );
      expect(error.status).toBe(409);
    });

    it('should create error for workspace shortcut duplicate', () => {
      const error = new DuplicateShortcutError('team-shortcut', 'workspace');

      expect(error.code).toBe(ShortcutErrorCode.DUPLICATE_NAME);
      expect(error.message).toBe("A shortcut named 'team-shortcut' already exists in workspace");
      expect(error.status).toBe(409);
    });
  });

  describe('ShortcutPermissionError', () => {
    it('should create error for create operation', () => {
      const error = new ShortcutPermissionError('create');

      expect(error.code).toBe(ShortcutErrorCode.PERMISSION_DENIED);
      expect(error.message).toBe('You do not have permission to create this shortcut');
      expect(error.status).toBe(403);
    });

    it('should create error with details', () => {
      const error = new ShortcutPermissionError(
        'update',
        'only admins can update workspace shortcuts'
      );

      expect(error.code).toBe(ShortcutErrorCode.PERMISSION_DENIED);
      expect(error.message).toBe(
        'You do not have permission to update this shortcut: only admins can update workspace shortcuts'
      );
      expect(error.status).toBe(403);
    });

    it('should create error for delete operation', () => {
      const error = new ShortcutPermissionError('delete');

      expect(error.code).toBe(ShortcutErrorCode.PERMISSION_DENIED);
      expect(error.message).toBe('You do not have permission to delete this shortcut');
      expect(error.status).toBe(403);
    });

    it('should create error for view operation', () => {
      const error = new ShortcutPermissionError('view');

      expect(error.code).toBe(ShortcutErrorCode.PERMISSION_DENIED);
      expect(error.message).toBe('You do not have permission to view this shortcut');
      expect(error.status).toBe(403);
    });
  });

  describe('ShortcutNotFoundError', () => {
    it('should create error without identifier', () => {
      const error = new ShortcutNotFoundError();

      expect(error.code).toBe(ShortcutErrorCode.NOT_FOUND);
      expect(error.message).toBe('Shortcut not found');
      expect(error.status).toBe(404);
    });

    it('should create error with identifier', () => {
      const error = new ShortcutNotFoundError('/daily-report');

      expect(error.code).toBe(ShortcutErrorCode.NOT_FOUND);
      expect(error.message).toBe("Shortcut '/daily-report' not found");
      expect(error.status).toBe(404);
    });
  });

  describe('InvalidShortcutNameError', () => {
    it('should create error with invalid name', () => {
      const error = new InvalidShortcutNameError('Invalid Name!');

      expect(error.code).toBe(ShortcutErrorCode.INVALID_NAME_FORMAT);
      expect(error.message).toBe(
        "Invalid shortcut name 'Invalid Name!'. Names must start with a lowercase letter and contain only lowercase letters, numbers, and hyphens"
      );
      expect(error.status).toBe(400);
    });
  });

  describe('OrganizationRequiredError', () => {
    it('should create error for missing organization', () => {
      const error = new OrganizationRequiredError();

      expect(error.code).toBe(ShortcutErrorCode.ORGANIZATION_REQUIRED);
      expect(error.message).toBe('User must belong to an organization');
      expect(error.status).toBe(400);
    });
  });

  describe('ConcurrentUpdateError', () => {
    it('should create error for concurrent update', () => {
      const error = new ConcurrentUpdateError('team-report');

      expect(error.code).toBe(ShortcutErrorCode.CONCURRENT_UPDATE);
      expect(error.message).toBe(
        "The shortcut 'team-report' was modified by another user. Please refresh and try again"
      );
      expect(error.status).toBe(409);
    });
  });

  describe('TransactionError', () => {
    it('should create error for transaction failure', () => {
      const error = new TransactionError('create');

      expect(error.code).toBe(ShortcutErrorCode.TRANSACTION_FAILED);
      expect(error.message).toBe(
        'Failed to create shortcut due to a transaction error. Please try again'
      );
      expect(error.status).toBe(500);
    });
  });
});
