import type { AssetType } from '@buster/server-shared';
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest';
import { getAssetAncestors } from './get-search-result-ancestors';

// Mock the database queries
vi.mock('@buster/database/queries', () => ({
  getAssetChatAncestors: vi.fn(),
  getAssetCollectionAncestors: vi.fn(),
  getMetricDashboardAncestors: vi.fn(),
  getMetricReportAncestors: vi.fn(),
}));

// Import the mocked functions
import {
  getAssetChatAncestors,
  getAssetCollectionAncestors,
  getMetricDashboardAncestors,
  getMetricReportAncestors,
} from '@buster/database/queries';

describe('get-search-result-ancestors.ts - Unit Tests', () => {
  const mockAssetId = 'test-asset-id';
  const mockUserId = 'test-user-id';
  const mockOrganizationId = 'test-org-id';

  const mockChats = [
    { id: 'chat-1', title: 'Chat 1' },
    { id: 'chat-2', title: 'Chat 2' },
  ];

  const mockCollections = [
    { id: 'collection-1', title: 'Collection 1' },
    { id: 'collection-2', title: 'Collection 2' },
  ];

  const mockDashboards = [
    { id: 'dashboard-1', title: 'Dashboard 1' },
    { id: 'dashboard-2', title: 'Dashboard 2' },
  ];

  const mockReports = [
    { id: 'report-1', title: 'Report 1' },
    { id: 'report-2', title: 'Report 2' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (getAssetChatAncestors as Mock).mockResolvedValue(mockChats);
    (getAssetCollectionAncestors as Mock).mockResolvedValue(mockCollections);
    (getMetricDashboardAncestors as Mock).mockResolvedValue(mockDashboards);
    (getMetricReportAncestors as Mock).mockResolvedValue(mockReports);
  });

  describe('getAssetAncestors', () => {
    it('should return all ancestors for metric_file asset type', async () => {
      const result = await getAssetAncestors(
        mockAssetId,
        'metric_file' as AssetType,
        mockUserId,
        mockOrganizationId
      );

      expect(result).toEqual({
        chats: mockChats,
        collections: mockCollections,
        dashboards: mockDashboards,
        reports: mockReports,
      });

      // Verify all functions were called
      expect(getAssetChatAncestors).toHaveBeenCalledWith(mockAssetId);
      expect(getAssetCollectionAncestors).toHaveBeenCalledWith(mockAssetId);
      expect(getMetricDashboardAncestors).toHaveBeenCalledWith(mockAssetId);
      expect(getMetricReportAncestors).toHaveBeenCalledWith(mockAssetId);
    });

    it('should return empty dashboards and reports for non-metric asset types', async () => {
      const result = await getAssetAncestors(
        mockAssetId,
        'message' as AssetType,
        mockUserId,
        mockOrganizationId
      );

      expect(result).toEqual({
        chats: mockChats,
        collections: mockCollections,
        dashboards: [],
        reports: [],
      });

      // Verify only chat and collection functions were called
      expect(getAssetChatAncestors).toHaveBeenCalledWith(mockAssetId);
      expect(getAssetCollectionAncestors).toHaveBeenCalledWith(mockAssetId);
      expect(getMetricDashboardAncestors).not.toHaveBeenCalled();
      expect(getMetricReportAncestors).not.toHaveBeenCalled();
    });

    it('should return empty dashboards and reports for dashboard_file asset type', async () => {
      const result = await getAssetAncestors(
        mockAssetId,
        'dashboard_file' as AssetType,
        mockUserId,
        mockOrganizationId
      );

      expect(result).toEqual({
        chats: mockChats,
        collections: mockCollections,
        dashboards: [],
        reports: [],
      });

      expect(getAssetChatAncestors).toHaveBeenCalledWith(mockAssetId);
      expect(getAssetCollectionAncestors).toHaveBeenCalledWith(mockAssetId);
      expect(getMetricDashboardAncestors).not.toHaveBeenCalled();
      expect(getMetricReportAncestors).not.toHaveBeenCalled();
    });

    it('should return empty dashboards and reports for report_file asset type', async () => {
      const result = await getAssetAncestors(
        mockAssetId,
        'report_file' as AssetType,
        mockUserId,
        mockOrganizationId
      );

      expect(result).toEqual({
        chats: mockChats,
        collections: mockCollections,
        dashboards: [],
        reports: [],
      });

      expect(getAssetChatAncestors).toHaveBeenCalledWith(mockAssetId);
      expect(getAssetCollectionAncestors).toHaveBeenCalledWith(mockAssetId);
      expect(getMetricDashboardAncestors).not.toHaveBeenCalled();
      expect(getMetricReportAncestors).not.toHaveBeenCalled();
    });

    it('should handle empty results from database queries', async () => {
      (getAssetChatAncestors as Mock).mockResolvedValue([]);
      (getAssetCollectionAncestors as Mock).mockResolvedValue([]);
      (getMetricDashboardAncestors as Mock).mockResolvedValue([]);
      (getMetricReportAncestors as Mock).mockResolvedValue([]);

      const result = await getAssetAncestors(
        mockAssetId,
        'metric_file' as AssetType,
        mockUserId,
        mockOrganizationId
      );

      expect(result).toEqual({
        chats: [],
        collections: [],
        dashboards: [],
        reports: [],
      });
    });

    it('should handle database errors gracefully', async () => {
      const error = new Error('Database connection failed');
      (getAssetChatAncestors as Mock).mockRejectedValue(error);

      await expect(
        getAssetAncestors(mockAssetId, 'metric_file' as AssetType, mockUserId, mockOrganizationId)
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle partial failures in Promise.all', async () => {
      const error = new Error('Collection query failed');
      (getAssetCollectionAncestors as Mock).mockRejectedValue(error);

      await expect(
        getAssetAncestors(mockAssetId, 'metric_file' as AssetType, mockUserId, mockOrganizationId)
      ).rejects.toThrow('Collection query failed');
    });

    it('should execute queries in parallel using Promise.all', async () => {
      const startTime = Date.now();

      // Add delays to verify parallel execution
      (getAssetChatAncestors as Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockChats), 10))
      );
      (getAssetCollectionAncestors as Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockCollections), 10))
      );
      (getMetricDashboardAncestors as Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockDashboards), 10))
      );
      (getMetricReportAncestors as Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockReports), 10))
      );

      const result = await getAssetAncestors(
        mockAssetId,
        'metric_file' as AssetType,
        mockUserId,
        mockOrganizationId
      );

      const endTime = Date.now();

      // If running sequentially, it would take ~40ms, parallel should be ~10ms
      expect(endTime - startTime).toBeLessThan(25);

      expect(result).toEqual({
        chats: mockChats,
        collections: mockCollections,
        dashboards: mockDashboards,
        reports: mockReports,
      });
    });

    it('should pass correct parameters to all query functions', async () => {
      await getAssetAncestors(
        mockAssetId,
        'metric_file' as AssetType,
        mockUserId,
        mockOrganizationId
      );

      expect(getAssetChatAncestors).toHaveBeenCalledWith(mockAssetId);
      expect(getAssetCollectionAncestors).toHaveBeenCalledWith(mockAssetId);
      expect(getMetricDashboardAncestors).toHaveBeenCalledWith(mockAssetId);
      expect(getMetricReportAncestors).toHaveBeenCalledWith(mockAssetId);

      // Verify each function was called exactly once
      expect(getAssetChatAncestors).toHaveBeenCalledTimes(1);
      expect(getAssetCollectionAncestors).toHaveBeenCalledTimes(1);
      expect(getMetricDashboardAncestors).toHaveBeenCalledTimes(1);
      expect(getMetricReportAncestors).toHaveBeenCalledTimes(1);
    });
  });
});
