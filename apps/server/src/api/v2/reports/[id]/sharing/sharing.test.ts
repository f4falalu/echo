import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock database functions
vi.mock('@buster/database', () => ({
  getReport: vi.fn(),
  checkAssetPermission: vi.fn(),
  findUsersByEmails: vi.fn(),
  bulkCreateAssetPermissions: vi.fn(),
  listAssetPermissions: vi.fn(),
  removeAssetPermission: vi.fn(),
  updateReport: vi.fn(),
  getUserOrganizationId: vi.fn(),
}));

// Mock middleware
vi.mock('../../../../../middleware/auth', () => ({
  requireAuth: vi.fn((c, next) => next()),
}));

// Mock the GET handler
vi.mock('../GET', () => ({
  getReportHandler: vi.fn(),
}));

import {
  bulkCreateAssetPermissions,
  checkAssetPermission,
  findUsersByEmails,
  getReport,
  getUserOrganizationId,
  listAssetPermissions,
  removeAssetPermission,
  updateReport,
} from '@buster/database';
import { testClient } from 'hono/testing';
import { getReportHandler } from '../GET';
import DELETE from './DELETE';
import GET from './GET';
import POST from './POST';
import PUT from './PUT';

describe('Report Sharing Endpoints', () => {
  const mockUser = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    avatarUrl: null,
  };

  const mockReport = {
    id: 'report-123',
    name: 'Test Report',
    content: 'Report content',
    created_by_id: 'user-123',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /reports/:id/sharing', () => {
    it('should create sharing permissions for valid users', async () => {
      const app = POST;
      const client = testClient(app, {
        set: { busterUser: mockUser },
        param: { id: 'report-123' },
      });

      vi.mocked(getReport).mockResolvedValue(mockReport as any);
      vi.mocked(checkAssetPermission).mockResolvedValue({
        hasAccess: true,
        role: 'owner',
        accessPath: 'direct',
      });
      vi.mocked(findUsersByEmails).mockResolvedValue(
        new Map([
          [
            'user2@example.com',
            {
              id: 'user-456',
              email: 'user2@example.com',
              name: 'User 2',
              avatarUrl: null,
            },
          ],
        ]) as any
      );
      vi.mocked(bulkCreateAssetPermissions).mockResolvedValue([]);

      const response = await client.index.$post({
        json: [
          {
            email: 'user2@example.com',
            role: 'can_view',
          },
        ],
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({
        success: true,
        shared: ['user2@example.com'],
        notFound: [],
      });
    });

    it('should return 403 if user lacks permission', async () => {
      const app = POST;
      const client = testClient(app, {
        set: { busterUser: mockUser },
        param: { id: 'report-123' },
      });

      vi.mocked(getReport).mockResolvedValue(mockReport as any);
      vi.mocked(checkAssetPermission).mockResolvedValue({
        hasAccess: true,
        role: 'can_view',
        accessPath: 'direct',
      });

      const response = await client.index.$post({
        json: [
          {
            email: 'user2@example.com',
            role: 'can_view',
          },
        ],
      });

      expect(response.status).toBe(403);
    });
  });

  describe('GET /reports/:id/sharing', () => {
    it('should list sharing permissions', async () => {
      const app = GET;
      const client = testClient(app, {
        set: { busterUser: mockUser },
        param: { id: 'report-123' },
      });

      vi.mocked(getReport).mockResolvedValue(mockReport as any);
      vi.mocked(checkAssetPermission).mockResolvedValue({
        hasAccess: true,
        role: 'can_view',
        accessPath: 'direct',
      });
      vi.mocked(listAssetPermissions).mockResolvedValue([
        {
          permission: {
            identityId: 'user-456',
            identityType: 'user',
            assetId: 'report-123',
            assetType: 'report_file',
            role: 'can_edit',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            deletedAt: null,
            createdBy: 'user-123',
            updatedBy: 'user-123',
          },
          user: {
            id: 'user-456',
            email: 'user2@example.com',
            name: 'User 2',
            avatarUrl: null,
          },
        },
      ] as any);

      const response = await client.index.$get();

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({
        permissions: [
          {
            userId: 'user-456',
            email: 'user2@example.com',
            name: 'User 2',
            avatarUrl: null,
            role: 'can_edit',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
      });
    });

    it('should return 403 if user lacks view permission', async () => {
      const app = GET;
      const client = testClient(app, {
        set: { busterUser: mockUser },
        param: { id: 'report-123' },
      });

      vi.mocked(getReport).mockResolvedValue(mockReport as any);
      vi.mocked(checkAssetPermission).mockResolvedValue({
        hasAccess: false,
      });

      const response = await client.index.$get();

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /reports/:id/sharing', () => {
    it('should remove sharing permissions', async () => {
      const app = DELETE;
      const client = testClient(app, {
        set: { busterUser: mockUser },
        param: { id: 'report-123' },
      });

      vi.mocked(getReport).mockResolvedValue(mockReport as any);
      vi.mocked(checkAssetPermission).mockResolvedValue({
        hasAccess: true,
        role: 'owner',
        accessPath: 'direct',
      });
      vi.mocked(findUsersByEmails).mockResolvedValue(
        new Map([
          [
            'user2@example.com',
            {
              id: 'user-456',
              email: 'user2@example.com',
              name: 'User 2',
              avatarUrl: null,
            },
          ],
        ]) as any
      );
      vi.mocked(removeAssetPermission).mockResolvedValue({} as any);

      const response = await client.index.$delete({
        json: ['user2@example.com'],
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({
        success: true,
        removed: ['user2@example.com'],
        notFound: [],
      });
    });

    it('should not remove owner permissions', async () => {
      const app = DELETE;
      const client = testClient(app, {
        set: { busterUser: mockUser },
        param: { id: 'report-123' },
      });

      vi.mocked(getReport).mockResolvedValue(mockReport as any);
      vi.mocked(checkAssetPermission).mockResolvedValue({
        hasAccess: true,
        role: 'owner',
        accessPath: 'direct',
      });
      vi.mocked(findUsersByEmails).mockResolvedValue(
        new Map([
          [
            'test@example.com',
            {
              id: 'user-123', // Same as creator
              email: 'test@example.com',
              name: 'Test User',
              avatarUrl: null,
            },
          ],
        ]) as any
      );

      const response = await client.index.$delete({
        json: ['test@example.com'],
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({
        success: true,
        removed: [], // Owner not removed
        notFound: [],
      });
      expect(removeAssetPermission).not.toHaveBeenCalled();
    });
  });

  describe('PUT /reports/:id/sharing', () => {
    it('should update sharing settings and permissions', async () => {
      const app = PUT;
      const client = testClient(app, {
        set: { busterUser: mockUser },
        param: { id: 'report-123' },
      });

      vi.mocked(getReport).mockResolvedValue(mockReport as any);
      vi.mocked(checkAssetPermission).mockResolvedValue({
        hasAccess: true,
        role: 'owner',
        accessPath: 'direct',
      });
      vi.mocked(getUserOrganizationId).mockResolvedValue({
        userId: 'user-123',
        organizationId: 'org-123',
      } as any);
      vi.mocked(findUsersByEmails).mockResolvedValue(
        new Map([
          [
            'user2@example.com',
            {
              id: 'user-456',
              email: 'user2@example.com',
              name: 'User 2',
              avatarUrl: null,
            },
          ],
        ]) as any
      );
      vi.mocked(bulkCreateAssetPermissions).mockResolvedValue([]);
      vi.mocked(updateReport).mockResolvedValue(undefined);
      vi.mocked(getReportHandler).mockResolvedValue({
        ...mockReport,
        publicly_accessible: true,
        permission: 'owner',
        workspace_sharing: null,
        individual_permissions: [],
        public_expiry_date: null,
        public_password: null,
        workspace_member_count: 1,
        collections: [],
        version_number: 1,
        versions: [],
        created_by_name: 'Test User',
        created_by_avatar: null,
      } as any);

      const response = await client.index.$put({
        json: {
          publicly_accessible: true,
          users: [
            {
              email: 'user2@example.com',
              role: 'can_edit',
            },
          ],
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('publicly_accessible', true);
      expect(updateReport).toHaveBeenCalledWith(
        expect.objectContaining({
          reportId: 'report-123',
          userId: 'user-123',
          publicly_accessible: true,
        }),
        false
      );
    });

    it('should return 403 if user lacks permission', async () => {
      const app = PUT;
      const client = testClient(app, {
        set: { busterUser: mockUser },
        param: { id: 'report-123' },
      });

      vi.mocked(getReport).mockResolvedValue(mockReport as any);
      vi.mocked(checkAssetPermission).mockResolvedValue({
        hasAccess: true,
        role: 'can_view',
        accessPath: 'direct',
      });
      vi.mocked(getUserOrganizationId).mockResolvedValue({
        userId: 'user-123',
        organizationId: 'org-123',
      } as any);

      const response = await client.index.$put({
        json: {
          publicly_accessible: true,
        },
      });

      expect(response.status).toBe(403);
    });
  });
});
