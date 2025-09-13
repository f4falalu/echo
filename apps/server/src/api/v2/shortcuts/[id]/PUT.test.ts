import type { User } from '@buster/database';
import { HTTPException } from 'hono/http-exception';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { updateShortcutHandler } from './PUT';

// Mock database functions
vi.mock('@buster/database', () => ({
  getUserOrganizationId: vi.fn(),
  getShortcutById: vi.fn(),
  checkDuplicateName: vi.fn(),
  updateShortcut: vi.fn(),
}));

import {
  checkDuplicateName,
  getShortcutById,
  getUserOrganizationId,
  updateShortcut,
} from '@buster/database';

describe('updateShortcutHandler', () => {
  const mockUser: User = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    avatarUrl: null,
  };

  const mockOrgMembership = {
    organizationId: 'org-123',
    role: 'viewer' as const,
  };

  const mockShortcut = {
    id: 'shortcut-123',
    name: 'existing-shortcut',
    instructions: 'Existing instructions',
    createdBy: 'user-123',
    updatedBy: null,
    organizationId: 'org-123',
    shareWithWorkspace: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUserOrganizationId).mockResolvedValue(mockOrgMembership);
    vi.mocked(getShortcutById).mockResolvedValue(mockShortcut);
    vi.mocked(checkDuplicateName).mockResolvedValue(false);
    vi.mocked(updateShortcut).mockResolvedValue({
      ...mockShortcut,
      name: 'updated-shortcut',
      updatedBy: null,
      deletedAt: null,
    });
  });

  describe('successful updates', () => {
    it('should update own personal shortcut', async () => {
      const request = {
        name: 'updated-shortcut',
        instructions: 'Updated instructions',
      };

      const result = await updateShortcutHandler(mockUser, 'shortcut-123', request);

      expect(getUserOrganizationId).toHaveBeenCalledWith(mockUser.id);
      expect(getShortcutById).toHaveBeenCalledWith({ id: 'shortcut-123' });
      expect(checkDuplicateName).toHaveBeenCalledWith({
        name: 'updated-shortcut',
        userId: mockUser.id,
        organizationId: 'org-123',
        isWorkspace: false,
        excludeId: 'shortcut-123',
      });
      expect(updateShortcut).toHaveBeenCalledWith({
        id: 'shortcut-123',
        name: 'updated-shortcut',
        instructions: 'Updated instructions',
        shareWithWorkspace: undefined,
        updatedBy: mockUser.id,
      });
      expect(result.name).toBe('updated-shortcut');
    });

    it('should update workspace shortcut as admin', async () => {
      vi.mocked(getUserOrganizationId).mockResolvedValue({
        organizationId: 'org-123',
        role: 'workspace_admin',
      });
      vi.mocked(getShortcutById).mockResolvedValue({
        ...mockShortcut,
        shareWithWorkspace: true,
      });

      const request = {
        name: 'updated-workspace',
      };

      await updateShortcutHandler(mockUser, 'shortcut-123', request);

      expect(updateShortcut).toHaveBeenCalledWith({
        id: 'shortcut-123',
        name: 'updated-workspace',
        instructions: undefined,
        shareWithWorkspace: undefined,
        updatedBy: mockUser.id,
      });
    });

    it('should update workspace shortcut as creator', async () => {
      vi.mocked(getShortcutById).mockResolvedValue({
        ...mockShortcut,
        shareWithWorkspace: true,
        createdBy: 'user-123',
      });

      const request = {
        instructions: 'New instructions only',
      };

      await updateShortcutHandler(mockUser, 'shortcut-123', request);

      expect(checkDuplicateName).not.toHaveBeenCalled(); // No name change
      expect(updateShortcut).toHaveBeenCalled();
    });

    it('should allow partial updates', async () => {
      const request = {
        name: 'new-name',
        // No instructions update
      };

      await updateShortcutHandler(mockUser, 'shortcut-123', request);

      expect(updateShortcut).toHaveBeenCalledWith({
        id: 'shortcut-123',
        name: 'new-name',
        instructions: undefined,
        shareWithWorkspace: undefined,
        updatedBy: mockUser.id,
      });
    });
  });

  describe('permission scenarios', () => {
    it("should reject updating another user's personal shortcut", async () => {
      vi.mocked(getShortcutById).mockResolvedValue({
        ...mockShortcut,
        createdBy: 'other-user-456',
      });

      const request = { name: 'hack-attempt' };

      await expect(updateShortcutHandler(mockUser, 'shortcut-123', request)).rejects.toThrow(
        'You can only update your own shortcuts'
      );
    });

    it('should reject workspace shortcut update by non-admin non-creator', async () => {
      vi.mocked(getShortcutById).mockResolvedValue({
        ...mockShortcut,
        shareWithWorkspace: true,
        createdBy: 'other-user-456',
      });

      const request = { name: 'unauthorized-update' };

      await expect(updateShortcutHandler(mockUser, 'shortcut-123', request)).rejects.toThrow(
        'Only workspace admins, data admins, or the shortcut creator can update workspace shortcuts'
      );
    });

    it('should reject changing share status by non-admin', async () => {
      const request = {
        shareWithWorkspace: true, // Trying to change from personal to workspace
      };

      await expect(updateShortcutHandler(mockUser, 'shortcut-123', request)).rejects.toThrow(
        'Only workspace admins and data admins can change shortcut sharing settings'
      );
    });

    it('should allow admin to change sharing status', async () => {
      vi.mocked(getUserOrganizationId).mockResolvedValue({
        organizationId: 'org-123',
        role: 'data_admin',
      });

      const request = {
        shareWithWorkspace: true,
      };

      await updateShortcutHandler(mockUser, 'shortcut-123', request);

      expect(updateShortcut).toHaveBeenCalledWith({
        id: 'shortcut-123',
        name: undefined,
        instructions: undefined,
        shareWithWorkspace: true,
        updatedBy: mockUser.id,
      });
    });
  });

  describe('validation', () => {
    it('should check for duplicate names when renaming', async () => {
      vi.mocked(checkDuplicateName).mockResolvedValue(true);

      const request = { name: 'duplicate-name' };

      await expect(updateShortcutHandler(mockUser, 'shortcut-123', request)).rejects.toThrow(
        "A shortcut named 'duplicate-name' already exists in your personal shortcuts"
      );
    });

    it('should exclude current shortcut when checking duplicates', async () => {
      const request = { name: 'new-unique-name' };

      await updateShortcutHandler(mockUser, 'shortcut-123', request);

      expect(checkDuplicateName).toHaveBeenCalledWith(
        expect.objectContaining({
          excludeId: 'shortcut-123',
        })
      );
    });

    it('should not check duplicates if name unchanged', async () => {
      const request = { instructions: 'Updated instructions only' };

      await updateShortcutHandler(mockUser, 'shortcut-123', request);

      expect(checkDuplicateName).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle non-existent shortcut', async () => {
      vi.mocked(getShortcutById).mockResolvedValue(null);

      const request = { name: 'update-ghost' };

      await expect(updateShortcutHandler(mockUser, 'non-existent', request)).rejects.toThrow(
        'Shortcut not found'
      );
    });

    it('should handle cross-organization access attempt', async () => {
      vi.mocked(getShortcutById).mockResolvedValue({
        ...mockShortcut,
        organizationId: 'different-org-456',
      });

      const request = { name: 'cross-org-hack' };

      await expect(updateShortcutHandler(mockUser, 'shortcut-123', request)).rejects.toThrow(
        'You do not have permission to update this shortcut'
      );
    });

    it('should preserve unchanged fields during partial update', async () => {
      const request = { name: 'only-name-changed' };

      await updateShortcutHandler(mockUser, 'shortcut-123', request);

      expect(updateShortcut).toHaveBeenCalledWith({
        id: 'shortcut-123',
        name: 'only-name-changed',
        instructions: undefined, // Not changed
        shareWithWorkspace: undefined, // Not changed
        updatedBy: mockUser.id,
      });
    });

    it('should handle database update failure', async () => {
      vi.mocked(updateShortcut).mockResolvedValue(undefined);

      const request = { name: 'will-fail' };

      await expect(updateShortcutHandler(mockUser, 'shortcut-123', request)).rejects.toThrow(
        'Failed to update shortcut'
      );
    });
  });

  describe('error handling', () => {
    it('should handle missing organization', async () => {
      vi.mocked(getUserOrganizationId).mockResolvedValue(null);

      const request = { name: 'test' };

      await expect(updateShortcutHandler(mockUser, 'shortcut-123', request)).rejects.toThrow(
        'User must belong to an organization'
      );
    });

    it('should handle unexpected database errors', async () => {
      vi.mocked(getShortcutById).mockRejectedValue(new Error('Database connection failed'));

      const request = { name: 'test' };

      await expect(updateShortcutHandler(mockUser, 'shortcut-123', request)).rejects.toThrow(
        'Failed to update shortcut'
      );
    });
  });
});
