import type { User } from '@buster/database/queries';
import * as dbQueries from '@buster/database/queries';
import type { CreateShortcutRequest } from '@buster/server-shared/shortcuts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createShortcutHandler } from './POST';
import {
  DuplicateShortcutError,
  InvalidShortcutNameError,
  OrganizationRequiredError,
  ShortcutPermissionError,
} from './services/shortcut-errors';

// Mock database functions
vi.mock('@buster/database', () => ({
  getUserOrganizationId: vi.fn(),
  createShortcut: vi.fn(),
}));

// Mock validators
vi.mock('./services/shortcut-validators', () => ({
  validateShortcutName: vi.fn(),
  validateInstructions: vi.fn((instructions: string) => instructions.trim()),
}));

describe('createShortcutHandler', () => {
  const mockUser: User = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    avatarUrl: null,
  };

  const mockRequest: CreateShortcutRequest = {
    name: 'test-shortcut',
    instructions: 'Test instructions',
    shareWithWorkspace: false,
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
    vi.mocked(dbQueries.createShortcut).mockResolvedValue(mockShortcut as any);
  });

  describe('successful creation', () => {
    it('should create personal shortcut for regular viewer', async () => {
      const result = await createShortcutHandler(mockUser, mockRequest);

      expect(result).toEqual(mockShortcut);
      expect(dbQueries.createShortcut).toHaveBeenCalledWith({
        name: 'test-shortcut',
        instructions: 'Test instructions',
        createdBy: 'user-123',
        organizationId: 'org-456',
        shareWithWorkspace: false,
      });
    });

    it('should create workspace shortcut for workspace admin', async () => {
      vi.mocked(dbQueries.getUserOrganizationId).mockResolvedValue({
        organizationId: 'org-456',
        role: 'workspace_admin',
      } as any);

      const workspaceRequest = {
        ...mockRequest,
        shareWithWorkspace: true,
      };

      const workspaceShortcut = {
        ...mockShortcut,
        shareWithWorkspace: true,
      };

      vi.mocked(dbQueries.createShortcut).mockResolvedValue(workspaceShortcut as any);

      const result = await createShortcutHandler(mockUser, workspaceRequest);

      expect(result).toEqual(workspaceShortcut);
      expect(dbQueries.createShortcut).toHaveBeenCalledWith({
        name: 'test-shortcut',
        instructions: 'Test instructions',
        createdBy: 'user-123',
        organizationId: 'org-456',
        shareWithWorkspace: true,
      });
    });

    it('should create workspace shortcut for data admin', async () => {
      vi.mocked(dbQueries.getUserOrganizationId).mockResolvedValue({
        organizationId: 'org-456',
        role: 'data_admin',
      } as any);

      const workspaceRequest = {
        ...mockRequest,
        shareWithWorkspace: true,
      };

      const workspaceShortcut = {
        ...mockShortcut,
        shareWithWorkspace: true,
      };

      vi.mocked(dbQueries.createShortcut).mockResolvedValue(workspaceShortcut as any);

      const result = await createShortcutHandler(mockUser, workspaceRequest);

      expect(result).toEqual(workspaceShortcut);
    });

    it('should default shareWithWorkspace to false when not provided', async () => {
      const requestWithoutShare = {
        name: 'test-shortcut',
        instructions: 'Test instructions',
      } as CreateShortcutRequest;

      await createShortcutHandler(mockUser, requestWithoutShare);

      expect(dbQueries.createShortcut).toHaveBeenCalledWith(
        expect.objectContaining({
          shareWithWorkspace: false,
        })
      );
    });
  });

  describe('error cases', () => {
    it('should throw OrganizationRequiredError when user has no organization', async () => {
      vi.mocked(dbQueries.getUserOrganizationId).mockResolvedValue(null);

      await expect(createShortcutHandler(mockUser, mockRequest)).rejects.toThrow(
        OrganizationRequiredError
      );
    });

    it('should throw ShortcutPermissionError when member tries to create workspace shortcut', async () => {
      const workspaceRequest = {
        ...mockRequest,
        shareWithWorkspace: true,
      };

      await expect(createShortcutHandler(mockUser, workspaceRequest)).rejects.toThrow(
        ShortcutPermissionError
      );
    });

    it('should throw DuplicateShortcutError when shortcut name already exists', async () => {
      vi.mocked(dbQueries.createShortcut).mockRejectedValue(
        new Error("Shortcut with name 'test-shortcut' already exists")
      );

      await expect(createShortcutHandler(mockUser, mockRequest)).rejects.toThrow(
        DuplicateShortcutError
      );
    });

    it('should handle validation errors', async () => {
      const { validateShortcutName } = await import('./services/shortcut-validators');
      vi.mocked(validateShortcutName).mockImplementation(() => {
        throw new InvalidShortcutNameError('invalid-NAME');
      });

      const invalidRequest = {
        ...mockRequest,
        name: 'invalid-NAME',
      };

      await expect(createShortcutHandler(mockUser, invalidRequest)).rejects.toThrow(
        InvalidShortcutNameError
      );
    });
  });

  describe('logging', () => {
    it('should log errors with truncated instructions', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(dbQueries.getUserOrganizationId).mockResolvedValue(null);

      const longInstructionsRequest = {
        ...mockRequest,
        instructions: 'x'.repeat(200),
      };

      try {
        await createShortcutHandler(mockUser, longInstructionsRequest);
      } catch {
        // Expected to throw
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in createShortcutHandler:',
        expect.objectContaining({
          userId: 'user-123',
          data: expect.objectContaining({
            instructions: expect.stringContaining('...'),
          }),
        })
      );

      consoleSpy.mockRestore();
    });
  });
});
