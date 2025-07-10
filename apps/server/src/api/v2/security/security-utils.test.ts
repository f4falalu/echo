import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HTTPException } from 'hono/http-exception';
import {
  validateUserOrganization,
  fetchOrganization,
  checkAdminPermissions,
  checkWorkspaceAdminPermission,
} from './security-utils';
import { createTestOrganization } from './test-fixtures';

// Mock dependencies
vi.mock('@buster/database', () => ({
  getUserOrganizationId: vi.fn(),
  db: {
    select: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    limit: vi.fn(),
  },
  organizations: {},
}));

import { getUserOrganizationId, db } from '@buster/database';

describe('security-utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateUserOrganization', () => {
    it('should return user organization when found', async () => {
      const mockOrgMembership = { organizationId: 'org-123', role: 'member' };
      vi.mocked(getUserOrganizationId).mockResolvedValueOnce(mockOrgMembership);

      const result = await validateUserOrganization('user-123');
      expect(result).toEqual(mockOrgMembership);
      expect(getUserOrganizationId).toHaveBeenCalledWith('user-123');
    });

    it('should throw 403 when user has no organization', async () => {
      vi.mocked(getUserOrganizationId).mockResolvedValueOnce(null);

      await expect(validateUserOrganization('user-123')).rejects.toThrow(HTTPException);
      await expect(validateUserOrganization('user-123')).rejects.toMatchObject({
        status: 403,
        message: 'User is not associated with an organization',
      });
    });
  });

  describe('fetchOrganization', () => {
    it('should return organization when found', async () => {
      const mockOrg = createTestOrganization({ id: 'org-123' });
      const mockDbChain = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([mockOrg]),
      };

      vi.mocked(db.select).mockReturnValue(mockDbChain as any);

      const result = await fetchOrganization('org-123');
      expect(result).toEqual(mockOrg);
    });

    it('should throw 404 when organization not found', async () => {
      const mockDbChain = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db.select).mockReturnValue(mockDbChain as any);

      await expect(fetchOrganization('org-123')).rejects.toThrow(HTTPException);
      await expect(fetchOrganization('org-123')).rejects.toMatchObject({
        status: 404,
        message: 'Organization not found',
      });
    });

    it('should throw 404 when query returns null', async () => {
      const mockDbChain = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([null]),
      };

      vi.mocked(db.select).mockReturnValue(mockDbChain as any);

      await expect(fetchOrganization('org-123')).rejects.toThrow(HTTPException);
      await expect(fetchOrganization('org-123')).rejects.toMatchObject({
        status: 404,
        message: 'Organization not found',
      });
    });
  });

  describe('checkAdminPermissions', () => {
    it('should allow workspace_admin role', () => {
      expect(() => checkAdminPermissions('workspace_admin')).not.toThrow();
    });

    it('should allow data_admin role', () => {
      expect(() => checkAdminPermissions('data_admin')).not.toThrow();
    });

    it('should reject other roles', () => {
      const roles = ['member', 'viewer', 'user', 'guest'];
      
      roles.forEach(role => {
        expect(() => checkAdminPermissions(role)).toThrow(HTTPException);
        expect(() => checkAdminPermissions(role)).toThrow('Insufficient permissions to manage approved domains');
      });
    });

    it('should reject null role', () => {
      expect(() => checkAdminPermissions(null)).toThrow(HTTPException);
      expect(() => checkAdminPermissions(null)).toThrow('Insufficient permissions to manage approved domains');
    });

    it('should reject undefined role', () => {
      expect(() => checkAdminPermissions(undefined as any)).toThrow(HTTPException);
    });
  });

  describe('checkWorkspaceAdminPermission', () => {
    it('should allow workspace_admin role', () => {
      expect(() => checkWorkspaceAdminPermission('workspace_admin')).not.toThrow();
    });

    it('should reject data_admin role', () => {
      expect(() => checkWorkspaceAdminPermission('data_admin')).toThrow(HTTPException);
      expect(() => checkWorkspaceAdminPermission('data_admin')).toThrow('Only workspace admins can update workspace settings');
    });

    it('should reject other roles', () => {
      const roles = ['admin', 'member', 'viewer', 'user'];
      
      roles.forEach(role => {
        expect(() => checkWorkspaceAdminPermission(role)).toThrow(HTTPException);
        expect(() => checkWorkspaceAdminPermission(role)).toThrow('Only workspace admins can update workspace settings');
      });
    });

    it('should reject null role', () => {
      expect(() => checkWorkspaceAdminPermission(null)).toThrow(HTTPException);
      expect(() => checkWorkspaceAdminPermission(null)).toThrow('Only workspace admins can update workspace settings');
    });
  });
});