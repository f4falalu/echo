import type { User } from '@buster/database/queries';
import * as dbQueries from '@buster/database/queries';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteShortcutHandler } from './[id]/DELETE';
import {
  OrganizationRequiredError,
  ShortcutNotFoundError,
  ShortcutPermissionError,
} from './services/shortcut-errors';

// Mock database functions
vi.mock('@buster/database', () => ({
  getUserOrganizationId: vi.fn(),
  getShortcutById: vi.fn(),
  deleteShortcut: vi.fn(),
}));

describe('deleteShortcutHandler', () => {
  const mockUser: User = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    avatarUrl: null,
  };

  const mockShortcut = {
    id: 'shortcut-789',
    name: 'test-shortcut',
    instructions: 'Test instructions',
    createdBy: 'user-123',
    updatedBy: null,
    organizationId: 'org-456',
    shareWithWorkspace: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default mocks
    vi.mocked(dbQueries.getUserOrganizationId).mockResolvedValue({
      organizationId: 'org-456',
      role: 'viewer',
    } as any);
    vi.mocked(dbQueries.getShortcutById).mockResolvedValue(mockShortcut as any);
    vi.mocked(dbQueries.deleteShortcut).mockResolvedValue({ success: true } as any);
  });

  describe('successful deletion', () => {
    it('should allow user to delete their own personal shortcut', async () => {
      const result = await deleteShortcutHandler(mockUser, 'shortcut-789');

      expect(result).toEqual({ success: true });
      expect(dbQueries.deleteShortcut).toHaveBeenCalledWith({
        id: 'shortcut-789',
        deletedBy: 'user-123',
      });
    });

    it('should allow workspace admin to delete any workspace shortcut', async () => {
      vi.mocked(dbQueries.getUserOrganizationId).mockResolvedValue({
        organizationId: 'org-456',
        role: 'workspace_admin',
      } as any);

      const workspaceShortcut = {
        ...mockShortcut,
        shareWithWorkspace: true,
        createdBy: 'other-user',
      };
      vi.mocked(dbQueries.getShortcutById).mockResolvedValue(workspaceShortcut as any);

      const result = await deleteShortcutHandler(mockUser, 'shortcut-789');

      expect(result).toEqual({ success: true });
      expect(dbQueries.deleteShortcut).toHaveBeenCalled();
    });

    it('should allow data admin to delete workspace shortcuts', async () => {
      vi.mocked(dbQueries.getUserOrganizationId).mockResolvedValue({
        organizationId: 'org-456',
        role: 'data_admin',
      } as any);

      const workspaceShortcut = {
        ...mockShortcut,
        shareWithWorkspace: true,
        createdBy: 'other-user',
      };
      vi.mocked(dbQueries.getShortcutById).mockResolvedValue(workspaceShortcut as any);

      const result = await deleteShortcutHandler(mockUser, 'shortcut-789');

      expect(result).toEqual({ success: true });
    });

    it('should allow creator to delete their own workspace shortcut', async () => {
      const workspaceShortcut = {
        ...mockShortcut,
        shareWithWorkspace: true,
        createdBy: 'user-123',
      };
      vi.mocked(dbQueries.getShortcutById).mockResolvedValue(workspaceShortcut as any);

      const result = await deleteShortcutHandler(mockUser, 'shortcut-789');

      expect(result).toEqual({ success: true });
    });
  });

  describe('error cases', () => {
    it('should throw OrganizationRequiredError when user has no organization', async () => {
      vi.mocked(dbQueries.getUserOrganizationId).mockResolvedValue(null);

      await expect(deleteShortcutHandler(mockUser, 'shortcut-789')).rejects.toThrow(
        OrganizationRequiredError
      );
    });

    it('should throw ShortcutNotFoundError when shortcut does not exist', async () => {
      vi.mocked(dbQueries.getShortcutById).mockResolvedValue(null);

      await expect(deleteShortcutHandler(mockUser, 'shortcut-789')).rejects.toThrow(
        ShortcutNotFoundError
      );
    });

    it('should throw ShortcutPermissionError when user cannot delete personal shortcut', async () => {
      const otherUserShortcut = {
        ...mockShortcut,
        createdBy: 'other-user',
        shareWithWorkspace: false,
      };
      vi.mocked(dbQueries.getShortcutById).mockResolvedValue(otherUserShortcut as any);

      await expect(deleteShortcutHandler(mockUser, 'shortcut-789')).rejects.toThrow(
        ShortcutPermissionError
      );
    });

    it('should throw ShortcutPermissionError when viewer tries to delete others workspace shortcut', async () => {
      const workspaceShortcut = {
        ...mockShortcut,
        shareWithWorkspace: true,
        createdBy: 'other-user',
      };
      vi.mocked(dbQueries.getShortcutById).mockResolvedValue(workspaceShortcut as any);

      await expect(deleteShortcutHandler(mockUser, 'shortcut-789')).rejects.toThrow(
        ShortcutPermissionError
      );
    });

    it('should throw error when shortcut is from different organization', async () => {
      const otherOrgShortcut = {
        ...mockShortcut,
        organizationId: 'other-org',
      };
      vi.mocked(dbQueries.getShortcutById).mockResolvedValue(otherOrgShortcut as any);

      await expect(deleteShortcutHandler(mockUser, 'shortcut-789')).rejects.toThrow(
        ShortcutPermissionError
      );
    });

    it('should throw error when delete operation fails', async () => {
      vi.mocked(dbQueries.deleteShortcut).mockResolvedValue(null as any);

      await expect(deleteShortcutHandler(mockUser, 'shortcut-789')).rejects.toThrow(
        'Failed to delete shortcut'
      );
    });
  });

  describe('logging', () => {
    it('should log errors with context', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(dbQueries.getShortcutById).mockResolvedValue(null);

      try {
        await deleteShortcutHandler(mockUser, 'shortcut-789');
      } catch {
        // Expected to throw
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in deleteShortcutHandler:',
        expect.objectContaining({
          userId: 'user-123',
          shortcutId: 'shortcut-789',
          error: expect.any(String),
        })
      );

      consoleSpy.mockRestore();
    });
  });
});
