import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AccessControlError } from '../types/errors';
import {
  checkCascadingPermissions,
  checkChatCollectionAccess,
  checkDashboardChatAccess,
  checkDashboardCollectionAccess,
  checkMetricChatAccess,
  checkMetricCollectionAccess,
  checkMetricDashboardAccess,
  checkMetricReportAccess,
} from './cascading-permissions';

// Mock database queries
vi.mock('@buster/database', () => ({
  checkCollectionsContainingAsset: vi.fn(),
  checkDashboardsContainingMetric: vi.fn(),
  checkChatsContainingAsset: vi.fn(),
  checkReportsContainingMetric: vi.fn(),
}));

// Mock hasAssetPermission
vi.mock('./permissions', () => ({
  hasAssetPermission: vi.fn(),
}));

// Mock cache
vi.mock('./cache', () => ({
  getCachedCascadingPermission: vi.fn(),
  setCachedCascadingPermission: vi.fn(),
}));

describe('Cascading Permissions', () => {
  let mockCheckDashboardsContainingMetric: any;
  let mockCheckChatsContainingAsset: any;
  let mockCheckCollectionsContainingAsset: any;
  let mockCheckReportsContainingMetric: any;
  let mockHasAssetPermission: any;
  let mockGetCachedCascadingPermission: any;
  let mockSetCachedCascadingPermission: any;

  const mockUser = { id: 'user123', email: 'test@example.com' };
  const mockOrganizationId = 'org123';

  beforeEach(async () => {
    vi.clearAllMocks();

    const db = await import('@buster/database');
    mockCheckDashboardsContainingMetric = vi.mocked(db.checkDashboardsContainingMetric);
    mockCheckChatsContainingAsset = vi.mocked(db.checkChatsContainingAsset);
    mockCheckCollectionsContainingAsset = vi.mocked(db.checkCollectionsContainingAsset);
    mockCheckReportsContainingMetric = vi.mocked(db.checkReportsContainingMetric);

    const permissions = await import('./permissions');
    mockHasAssetPermission = vi.mocked(permissions.hasAssetPermission);

    const cache = await import('./cache');
    mockGetCachedCascadingPermission = vi.mocked(cache.getCachedCascadingPermission);
    mockSetCachedCascadingPermission = vi.mocked(cache.setCachedCascadingPermission);
  });

  describe('checkMetricDashboardAccess', () => {
    it('should return true if user has access to any dashboard containing the metric', async () => {
      mockCheckDashboardsContainingMetric.mockResolvedValue([
        { id: 'dash1', organizationId: mockOrganizationId, workspaceSharing: 'none' },
        { id: 'dash2', organizationId: mockOrganizationId, workspaceSharing: 'can_view' },
      ]);

      mockHasAssetPermission
        .mockResolvedValueOnce(false) // dash1 - no access
        .mockResolvedValueOnce(true); // dash2 - has access

      const result = await checkMetricDashboardAccess('metric123', mockUser as any);

      expect(result).toBe(true);
      expect(mockCheckDashboardsContainingMetric).toHaveBeenCalledWith('metric123');
      expect(mockHasAssetPermission).toHaveBeenCalledTimes(2);
      expect(mockHasAssetPermission).toHaveBeenNthCalledWith(1, {
        assetId: 'dash1',
        assetType: 'dashboard_file',
        userId: 'user123',
        requiredRole: 'can_view',
        organizationId: mockOrganizationId,
        workspaceSharing: 'none',
      });
      expect(mockHasAssetPermission).toHaveBeenNthCalledWith(2, {
        assetId: 'dash2',
        assetType: 'dashboard_file',
        userId: 'user123',
        requiredRole: 'can_view',
        organizationId: mockOrganizationId,
        workspaceSharing: 'can_view',
      });
    });

    it('should handle workspace sharing access', async () => {
      mockCheckDashboardsContainingMetric.mockResolvedValue([
        { id: 'dash1', organizationId: mockOrganizationId, workspaceSharing: 'can_edit' },
      ]);

      mockHasAssetPermission.mockResolvedValue(true); // Has access via workspace sharing

      const result = await checkMetricDashboardAccess('metric123', mockUser as any);

      expect(result).toBe(true);
      expect(mockHasAssetPermission).toHaveBeenCalledWith({
        assetId: 'dash1',
        assetType: 'dashboard_file',
        userId: 'user123',
        requiredRole: 'can_view',
        organizationId: mockOrganizationId,
        workspaceSharing: 'can_edit',
      });
    });

    it('should handle null workspace sharing', async () => {
      mockCheckDashboardsContainingMetric.mockResolvedValue([
        { id: 'dash1', organizationId: mockOrganizationId, workspaceSharing: null },
      ]);

      mockHasAssetPermission.mockResolvedValue(false);

      const result = await checkMetricDashboardAccess('metric123', mockUser as any);

      expect(result).toBe(false);
      expect(mockHasAssetPermission).toHaveBeenCalledWith({
        assetId: 'dash1',
        assetType: 'dashboard_file',
        userId: 'user123',
        requiredRole: 'can_view',
        organizationId: mockOrganizationId,
        workspaceSharing: 'none',
      });
    });

    it('should return false if no dashboards contain the metric', async () => {
      mockCheckDashboardsContainingMetric.mockResolvedValue([]);

      const result = await checkMetricDashboardAccess('metric123', mockUser as any);

      expect(result).toBe(false);
      expect(mockHasAssetPermission).not.toHaveBeenCalled();
    });

    it('should return false if user has no access to any dashboard', async () => {
      mockCheckDashboardsContainingMetric.mockResolvedValue([
        { id: 'dash1', organizationId: mockOrganizationId, workspaceSharing: 'none' },
        { id: 'dash2', organizationId: mockOrganizationId, workspaceSharing: 'none' },
      ]);

      mockHasAssetPermission.mockResolvedValue(false);

      const result = await checkMetricDashboardAccess('metric123', mockUser as any);

      expect(result).toBe(false);
      expect(mockHasAssetPermission).toHaveBeenCalledTimes(2);
    });

    it('should handle errors', async () => {
      mockCheckDashboardsContainingMetric.mockRejectedValue(new Error('DB Error'));

      await expect(checkMetricDashboardAccess('metric123', mockUser as any)).rejects.toThrow(
        AccessControlError
      );
    });
  });

  describe('checkMetricReportAccess', () => {
    it('should check if user has access to reports containing the metric', async () => {
      mockCheckReportsContainingMetric.mockResolvedValue([
        { id: 'report1', organizationId: mockOrganizationId, workspaceSharing: 'can_view' },
        { id: 'report2', organizationId: mockOrganizationId, workspaceSharing: 'none' },
      ]);

      mockHasAssetPermission.mockResolvedValueOnce(true); // report1 - has access

      const result = await checkMetricReportAccess('metric123', mockUser as any);

      expect(result).toBe(true);
      expect(mockCheckReportsContainingMetric).toHaveBeenCalledWith('metric123');
      expect(mockHasAssetPermission).toHaveBeenCalledTimes(1); // Stops on first match
      expect(mockHasAssetPermission).toHaveBeenCalledWith({
        assetId: 'report1',
        assetType: 'report_file',
        userId: 'user123',
        requiredRole: 'can_view',
        organizationId: mockOrganizationId,
        workspaceSharing: 'can_view',
      });
    });

    it('should return false if no reports contain the metric', async () => {
      mockCheckReportsContainingMetric.mockResolvedValue([]);

      const result = await checkMetricReportAccess('metric123', mockUser as any);

      expect(result).toBe(false);
      expect(mockHasAssetPermission).not.toHaveBeenCalled();
    });

    it('should handle workspace sharing on reports', async () => {
      mockCheckReportsContainingMetric.mockResolvedValue([
        { id: 'report1', organizationId: mockOrganizationId, workspaceSharing: 'full_access' },
      ]);

      mockHasAssetPermission.mockResolvedValue(true);

      const result = await checkMetricReportAccess('metric123', mockUser as any);

      expect(result).toBe(true);
      expect(mockHasAssetPermission).toHaveBeenCalledWith({
        assetId: 'report1',
        assetType: 'report_file',
        userId: 'user123',
        requiredRole: 'can_view',
        organizationId: mockOrganizationId,
        workspaceSharing: 'full_access',
      });
    });
  });

  describe('checkMetricChatAccess', () => {
    it('should check if user has access to chats containing the metric with workspace sharing', async () => {
      mockCheckChatsContainingAsset.mockResolvedValue([
        { id: 'chat1', organizationId: mockOrganizationId, workspaceSharing: 'can_view' },
        { id: 'chat2', organizationId: mockOrganizationId, workspaceSharing: 'none' },
      ]);

      mockHasAssetPermission.mockResolvedValueOnce(true); // chat1 - has access

      const result = await checkMetricChatAccess('metric123', mockUser as any);

      expect(result).toBe(true);
      expect(mockCheckChatsContainingAsset).toHaveBeenCalledWith('metric123', 'metric_file');
      expect(mockHasAssetPermission).toHaveBeenCalledTimes(1); // Stops on first match
      expect(mockHasAssetPermission).toHaveBeenCalledWith({
        assetId: 'chat1',
        assetType: 'chat',
        userId: 'user123',
        requiredRole: 'can_view',
        organizationId: mockOrganizationId,
        workspaceSharing: 'can_view',
      });
    });
  });

  describe('checkMetricCollectionAccess', () => {
    it('should check collections with workspace sharing', async () => {
      mockCheckCollectionsContainingAsset.mockResolvedValue([
        { id: 'coll1', organizationId: mockOrganizationId, workspaceSharing: 'can_edit' },
      ]);

      mockHasAssetPermission.mockResolvedValue(true);

      const result = await checkMetricCollectionAccess('metric123', mockUser as any);

      expect(result).toBe(true);
      expect(mockCheckCollectionsContainingAsset).toHaveBeenCalledWith('metric123', 'metric_file');
      expect(mockHasAssetPermission).toHaveBeenCalledWith({
        assetId: 'coll1',
        assetType: 'collection',
        userId: 'user123',
        requiredRole: 'can_view',
        organizationId: mockOrganizationId,
        workspaceSharing: 'can_edit',
      });
    });
  });

  describe('checkDashboardCollectionAccess', () => {
    it('should check if user has access to collections containing the dashboard with workspace sharing', async () => {
      mockCheckCollectionsContainingAsset.mockResolvedValue([
        { id: 'coll1', organizationId: mockOrganizationId, workspaceSharing: 'can_view' },
      ]);

      mockHasAssetPermission.mockResolvedValue(true);

      const result = await checkDashboardCollectionAccess('dash123', mockUser as any);

      expect(result).toBe(true);
      expect(mockCheckCollectionsContainingAsset).toHaveBeenCalledWith('dash123', 'dashboard_file');
      expect(mockHasAssetPermission).toHaveBeenCalledWith({
        assetId: 'coll1',
        assetType: 'collection',
        userId: 'user123',
        requiredRole: 'can_view',
        organizationId: mockOrganizationId,
        workspaceSharing: 'can_view',
      });
    });
  });

  describe('checkCascadingPermissions', () => {
    beforeEach(() => {
      // Cache returns undefined by default (not cached)
      mockGetCachedCascadingPermission.mockReturnValue(undefined);
    });

    it('should use cached result if available', async () => {
      mockGetCachedCascadingPermission.mockReturnValue(true);

      const result = await checkCascadingPermissions('asset123', 'metric_file', mockUser as any);

      expect(result).toBe(true);
      expect(mockGetCachedCascadingPermission).toHaveBeenCalledWith(
        'user123',
        'asset123',
        'metric_file'
      );
      // Should not call any check functions
      expect(mockCheckDashboardsContainingMetric).not.toHaveBeenCalled();
    });

    it('should check all paths for metrics including reports', async () => {
      // No dashboards
      mockCheckDashboardsContainingMetric.mockResolvedValue([]);
      // No chats
      mockCheckChatsContainingAsset.mockResolvedValue([]);
      // No collections
      mockCheckCollectionsContainingAsset.mockResolvedValue([]);
      // Has report access
      mockCheckReportsContainingMetric.mockResolvedValue([
        { id: 'report1', organizationId: mockOrganizationId, workspaceSharing: 'can_view' },
      ]);
      mockHasAssetPermission.mockResolvedValue(true);

      const result = await checkCascadingPermissions('metric123', 'metric_file', mockUser as any);

      expect(result).toBe(true);
      expect(mockCheckReportsContainingMetric).toHaveBeenCalledWith('metric123');
      expect(mockSetCachedCascadingPermission).toHaveBeenCalledWith(
        'user123',
        'metric123',
        'metric_file',
        true
      );
    });

    it('should check metric_file type same as metric', async () => {
      // Has dashboard access with workspace sharing
      mockCheckDashboardsContainingMetric.mockResolvedValue([
        { id: 'dash1', organizationId: mockOrganizationId, workspaceSharing: 'full_access' },
      ]);
      mockHasAssetPermission.mockResolvedValue(true);

      const result = await checkCascadingPermissions('metric123', 'metric_file', mockUser as any);

      expect(result).toBe(true);
      expect(mockCheckDashboardsContainingMetric).toHaveBeenCalledWith('metric123');
    });

    it('should check dashboard cascading paths with workspace sharing', async () => {
      // Has chat access with workspace sharing
      mockCheckChatsContainingAsset.mockResolvedValue([
        { id: 'chat1', organizationId: mockOrganizationId, workspaceSharing: 'can_edit' },
      ]);
      mockHasAssetPermission.mockResolvedValue(true);

      const result = await checkCascadingPermissions('dash123', 'dashboard_file', mockUser as any);

      expect(result).toBe(true);
      expect(mockCheckChatsContainingAsset).toHaveBeenCalledWith('dash123', 'dashboard_file');
    });

    it('should check dashboard_file type same as dashboard', async () => {
      // No chat access
      mockCheckChatsContainingAsset.mockResolvedValue([]);
      // Has collection access
      mockCheckCollectionsContainingAsset.mockResolvedValue([
        { id: 'coll1', organizationId: mockOrganizationId, workspaceSharing: 'can_view' },
      ]);
      mockHasAssetPermission.mockResolvedValue(true);

      const result = await checkCascadingPermissions('dash123', 'dashboard_file', mockUser as any);

      expect(result).toBe(true);
      expect(mockCheckChatsContainingAsset).toHaveBeenCalledWith('dash123', 'dashboard_file');
      expect(mockCheckCollectionsContainingAsset).toHaveBeenCalledWith('dash123', 'dashboard_file');
    });

    it('should check chat cascading paths', async () => {
      // No collection access
      mockCheckCollectionsContainingAsset.mockResolvedValue([]);

      const result = await checkCascadingPermissions('chat123', 'chat', mockUser as any);

      expect(result).toBe(false);
      expect(mockSetCachedCascadingPermission).toHaveBeenCalledWith(
        'user123',
        'chat123',
        'chat',
        false
      );
    });

    it('should return false for collections (no cascading)', async () => {
      const result = await checkCascadingPermissions('coll123', 'collection', mockUser as any);

      expect(result).toBe(false);
      // Should not call any check functions
      expect(mockCheckCollectionsContainingAsset).not.toHaveBeenCalled();
    });

    it('should return false for report_file (no cascading)', async () => {
      const result = await checkCascadingPermissions('report123', 'report_file', mockUser as any);

      expect(result).toBe(false);
      // Should not call any check functions
      expect(mockCheckReportsContainingMetric).not.toHaveBeenCalled();
    });

    it('should return false for unknown asset types', async () => {
      const result = await checkCascadingPermissions(
        'unknown123',
        'unknown' as any,
        mockUser as any
      );

      expect(result).toBe(false);
    });

    it('should cache negative results', async () => {
      mockCheckDashboardsContainingMetric.mockResolvedValue([]);
      mockCheckChatsContainingAsset.mockResolvedValue([]);
      mockCheckCollectionsContainingAsset.mockResolvedValue([]);
      mockCheckReportsContainingMetric.mockResolvedValue([]);

      const result = await checkCascadingPermissions('metric123', 'metric_file', mockUser as any);

      expect(result).toBe(false);
      expect(mockSetCachedCascadingPermission).toHaveBeenCalledWith(
        'user123',
        'metric123',
        'metric_file',
        false
      );
    });

    it('should handle errors and not cache', async () => {
      mockCheckDashboardsContainingMetric.mockRejectedValue(new Error('DB Error'));

      await expect(
        checkCascadingPermissions('metric123', 'metric_file', mockUser as any)
      ).rejects.toThrow(AccessControlError);

      expect(mockSetCachedCascadingPermission).not.toHaveBeenCalled();
    });

    it('should stop checking on first successful access path', async () => {
      // Has dashboard access (first check)
      mockCheckDashboardsContainingMetric.mockResolvedValue([
        { id: 'dash1', organizationId: mockOrganizationId, workspaceSharing: 'can_view' },
      ]);
      mockHasAssetPermission.mockResolvedValue(true);

      const result = await checkCascadingPermissions('metric123', 'metric_file', mockUser as any);

      expect(result).toBe(true);
      // Should not check other paths
      expect(mockCheckChatsContainingAsset).not.toHaveBeenCalled();
      expect(mockCheckCollectionsContainingAsset).not.toHaveBeenCalled();
      expect(mockCheckReportsContainingMetric).not.toHaveBeenCalled();
    });
  });

  describe('Workspace Sharing Edge Cases', () => {
    it('should handle mixed workspace sharing levels', async () => {
      mockCheckDashboardsContainingMetric.mockResolvedValue([
        { id: 'dash1', organizationId: mockOrganizationId, workspaceSharing: 'none' },
        { id: 'dash2', organizationId: mockOrganizationId, workspaceSharing: 'can_view' },
        { id: 'dash3', organizationId: mockOrganizationId, workspaceSharing: 'can_edit' },
        { id: 'dash4', organizationId: mockOrganizationId, workspaceSharing: 'full_access' },
      ]);

      mockHasAssetPermission
        .mockResolvedValueOnce(false) // dash1 - no access (none)
        .mockResolvedValueOnce(false) // dash2 - no access (can_view)
        .mockResolvedValueOnce(true); // dash3 - has access (can_edit)

      const result = await checkMetricDashboardAccess('metric123', mockUser as any);

      expect(result).toBe(true);
      expect(mockHasAssetPermission).toHaveBeenCalledTimes(3); // Stops on first success

      // Verify each call had the correct workspace sharing
      expect(mockHasAssetPermission).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ workspaceSharing: 'none' })
      );
      expect(mockHasAssetPermission).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ workspaceSharing: 'can_view' })
      );
      expect(mockHasAssetPermission).toHaveBeenNthCalledWith(
        3,
        expect.objectContaining({ workspaceSharing: 'can_edit' })
      );
    });

    it('should handle assets in multiple organizations', async () => {
      const org1 = 'org1';
      const org2 = 'org2';

      mockCheckDashboardsContainingMetric.mockResolvedValue([
        { id: 'dash1', organizationId: org1, workspaceSharing: 'can_view' },
        { id: 'dash2', organizationId: org2, workspaceSharing: 'can_view' },
      ]);

      mockHasAssetPermission
        .mockResolvedValueOnce(false) // dash1 in org1 - no access
        .mockResolvedValueOnce(true); // dash2 in org2 - has access

      const result = await checkMetricDashboardAccess('metric123', mockUser as any);

      expect(result).toBe(true);

      // Verify different org IDs were passed
      expect(mockHasAssetPermission).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ organizationId: org1 })
      );
      expect(mockHasAssetPermission).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ organizationId: org2 })
      );
    });
  });
});
