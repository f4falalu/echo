import type { SearchTextData, SearchTextRequest, SearchTextResponse } from '@buster/server-shared';
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest';
import { performTextSearch } from './search';

// Mock dependencies
vi.mock('@buster/database/queries', () => ({
  getUserOrganizationId: vi.fn(),
  searchText: vi.fn(),
  getAssetAncestors: vi.fn(),
}));

vi.mock('./text-processing-helpers', () => ({
  processSearchResultText: vi.fn(),
}));

// Import the mocked functions
import { getAssetAncestors, getUserOrganizationId, searchText } from '@buster/database/queries';
import { processSearchResultText } from './text-processing-helpers';

describe('search.ts - Unit Tests', () => {
  const mockUserId = 'test-user-id';
  const mockOrganizationId = 'test-org-id';

  const mockUserOrg = {
    organizationId: mockOrganizationId,
    userId: mockUserId,
  };

  const mockSearchResults: SearchTextData[] = [
    {
      assetId: 'asset-1',
      assetType: 'chat',
      title: 'Test Result 1',
      additionalText: 'This is additional text for result 1',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      assetId: 'asset-2',
      assetType: 'metric_file',
      title: 'Test Result 2',
      additionalText: 'This is additional text for result 2',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ];

  const mockSearchResponse: SearchTextResponse = {
    data: mockSearchResults,
    pagination: {
      page: 1,
      page_size: 10,
      has_more: false,
    },
  };

  const mockAncestors = {
    chats: [{ id: 'chat-1', title: 'Chat 1' }],
    collections: [{ id: 'collection-1', title: 'Collection 1' }],
    dashboards: [],
    reports: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getUserOrganizationId as Mock).mockResolvedValue(mockUserOrg);
    (searchText as Mock).mockResolvedValue(mockSearchResponse);
    (processSearchResultText as Mock).mockImplementation((query, title, additionalText) => ({
      processedTitle: `<b>${title}</b>`,
      processedAdditionalText: `<b>${additionalText}</b>`,
    }));
    (getAssetAncestors as Mock).mockResolvedValue(mockAncestors);
  });

  describe('performTextSearch', () => {
    const basicSearchRequest: SearchTextRequest = {
      query: 'test query',
      page: 1,
      page_size: 10,
      includeAssetAncestors: false,
    };

    it('should perform basic text search successfully', async () => {
      const result = await performTextSearch(mockUserId, basicSearchRequest);

      expect(getUserOrganizationId).toHaveBeenCalledWith(mockUserId);
      expect(searchText).toHaveBeenCalledWith({
        userId: mockUserId,
        searchString: 'test query',
        organizationId: mockOrganizationId,
        page: 1,
        page_size: 10,
        filters: {},
      });

      expect(result).toEqual({
        data: [
          {
            ...mockSearchResults[0],
            title: '<b>Test Result 1</b>',
            additionalText: '<b>This is additional text for result 1</b>',
          },
          {
            ...mockSearchResults[1],
            title: '<b>Test Result 2</b>',
            additionalText: '<b>This is additional text for result 2</b>',
          },
        ],
        pagination: {
          page: 1,
          page_size: 10,
          has_more: false,
        },
      });

      expect(processSearchResultText).toHaveBeenCalledTimes(2);
      expect(processSearchResultText).toHaveBeenCalledWith(
        'test query',
        'Test Result 1',
        'This is additional text for result 1'
      );
      expect(processSearchResultText).toHaveBeenCalledWith(
        'test query',
        'Test Result 2',
        'This is additional text for result 2'
      );
    });

    it('should handle search with asset type filters', async () => {
      const searchRequestWithFilters: SearchTextRequest = {
        ...basicSearchRequest,
        assetTypes: ['chat', 'metric_file'],
      };

      await performTextSearch(mockUserId, searchRequestWithFilters);

      expect(searchText).toHaveBeenCalledWith({
        userId: mockUserId,
        searchString: 'test query',
        organizationId: mockOrganizationId,
        page: 1,
        page_size: 10,
        filters: {
          assetTypes: ['chat', 'metric_file'],
        },
      });
    });

    it('should handle single asset type filter', async () => {
      const searchRequestWithSingleFilter: SearchTextRequest = {
        ...basicSearchRequest,
        assetTypes: 'chat',
      };

      await performTextSearch(mockUserId, searchRequestWithSingleFilter);

      expect(searchText).toHaveBeenCalledWith({
        userId: mockUserId,
        searchString: 'test query',
        organizationId: mockOrganizationId,
        page: 1,
        page_size: 10,
        filters: {
          assetTypes: ['chat'],
        },
      });
    });

    it('should handle date range filters', async () => {
      const searchRequestWithDateFilters: SearchTextRequest = {
        ...basicSearchRequest,
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-31T23:59:59.999Z',
      };

      await performTextSearch(mockUserId, searchRequestWithDateFilters);

      expect(searchText).toHaveBeenCalledWith({
        userId: mockUserId,
        searchString: 'test query',
        organizationId: mockOrganizationId,
        page: 1,
        page_size: 10,
        filters: {
          dateRange: {
            startDate: '2024-01-01T00:00:00.000Z',
            endDate: '2024-01-31T23:59:59.999Z',
          },
        },
      });
    });

    it('should handle combined filters', async () => {
      const searchRequestWithAllFilters: SearchTextRequest = {
        ...basicSearchRequest,
        assetTypes: ['chat'],
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-31T23:59:59.999Z',
      };

      await performTextSearch(mockUserId, searchRequestWithAllFilters);

      expect(searchText).toHaveBeenCalledWith({
        userId: mockUserId,
        searchString: 'test query',
        organizationId: mockOrganizationId,
        page: 1,
        page_size: 10,
        filters: {
          assetTypes: ['chat'],
          dateRange: {
            startDate: '2024-01-01T00:00:00.000Z',
            endDate: '2024-01-31T23:59:59.999Z',
          },
        },
      });
    });

    it('should include asset ancestors when requested', async () => {
      const searchRequestWithAncestors: SearchTextRequest = {
        ...basicSearchRequest,
        includeAssetAncestors: true,
      };

      const result = await performTextSearch(mockUserId, searchRequestWithAncestors);

      expect(getAssetAncestors).toHaveBeenCalledTimes(2);
      expect(getAssetAncestors).toHaveBeenCalledWith(
        'asset-1',
        'chat',
        mockUserId,
        mockOrganizationId
      );
      expect(getAssetAncestors).toHaveBeenCalledWith(
        'asset-2',
        'metric_file',
        mockUserId,
        mockOrganizationId
      );

      expect(result.data[0]).toHaveProperty('ancestors', mockAncestors);
      expect(result.data[1]).toHaveProperty('ancestors', mockAncestors);
    });

    it('should not include ancestors when not requested', async () => {
      const result = await performTextSearch(mockUserId, basicSearchRequest);

      expect(getAssetAncestors).not.toHaveBeenCalled();
      expect(result.data[0]).not.toHaveProperty('ancestors');
      expect(result.data[1]).not.toHaveProperty('ancestors');
    });

    it('should handle empty search results', async () => {
      const emptySearchResponse: SearchTextResponse = {
        data: [],
        pagination: {
          page: 1,
          page_size: 10,
          has_more: false,
        },
      };

      (searchText as Mock).mockResolvedValue(emptySearchResponse);

      const result = await performTextSearch(mockUserId, basicSearchRequest);

      expect(result).toEqual(emptySearchResponse);
      expect(processSearchResultText).not.toHaveBeenCalled();
      expect(getAssetAncestors).not.toHaveBeenCalled();
    });

    it('should handle null/undefined additional text', async () => {
      const mockResultsWithNullText: SearchTextData[] = [
        {
          assetId: 'asset-1',
          assetType: 'chat',
          title: 'Test Result 1',
          additionalText: null,
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ];

      (searchText as Mock).mockResolvedValue({
        ...mockSearchResponse,
        data: mockResultsWithNullText,
      });

      await performTextSearch(mockUserId, basicSearchRequest);

      expect(processSearchResultText).toHaveBeenCalledWith('test query', 'Test Result 1', '');
    });

    it('should handle null query', async () => {
      const searchRequestWithNullQuery: SearchTextRequest = {
        ...basicSearchRequest,
        query: null,
      };

      await performTextSearch(mockUserId, searchRequestWithNullQuery);

      expect(processSearchResultText).toHaveBeenCalledWith(
        '',
        'Test Result 1',
        'This is additional text for result 1'
      );
    });

    it('should throw error when user has no organization', async () => {
      (getUserOrganizationId as Mock).mockResolvedValue(null);

      await expect(performTextSearch(mockUserId, basicSearchRequest)).rejects.toThrow(
        'User is not associated with an organization'
      );

      expect(searchText).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const error = new Error('Database connection failed');
      (searchText as Mock).mockRejectedValue(error);

      await expect(performTextSearch(mockUserId, basicSearchRequest)).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should process search results in chunks when including ancestors', async () => {
      // Create many search results to test chunking
      const manyResults: SearchTextData[] = Array.from({ length: 12 }, (_, i) => ({
        assetId: `asset-${i + 1}`,
        assetType: 'chat',
        title: `Test Result ${i + 1}`,
        additionalText: `Additional text ${i + 1}`,
        updatedAt: '2024-01-01T00:00:00.000Z',
      }));

      (searchText as Mock).mockResolvedValue({
        ...mockSearchResponse,
        data: manyResults,
        pagination: {
          page: 1,
          page_size: 10,
          has_more: true,
        },
      });

      const searchRequestWithAncestors: SearchTextRequest = {
        ...basicSearchRequest,
        includeAssetAncestors: true,
      };

      const result = await performTextSearch(mockUserId, searchRequestWithAncestors);

      // Should call getAssetAncestors for each result
      expect(getAssetAncestors).toHaveBeenCalledTimes(12);

      // Results should have ancestors added
      expect(result.data).toHaveLength(12);
      result.data.forEach((item) => {
        expect(item).toHaveProperty('ancestors', mockAncestors);
      });
    });

    it('should handle ancestor lookup failures gracefully', async () => {
      const searchRequestWithAncestors: SearchTextRequest = {
        ...basicSearchRequest,
        includeAssetAncestors: true,
      };

      (getAssetAncestors as Mock).mockRejectedValue(new Error('Ancestor lookup failed'));

      await expect(performTextSearch(mockUserId, searchRequestWithAncestors)).rejects.toThrow(
        'Ancestor lookup failed'
      );
    });

    it('should preserve original search response metadata', async () => {
      const searchResponseWithMetadata: SearchTextResponse = {
        ...mockSearchResponse,
        pagination: {
          page: 2,
          page_size: 25,
          has_more: true,
        },
      };

      (searchText as Mock).mockResolvedValue(searchResponseWithMetadata);

      const result = await performTextSearch(mockUserId, basicSearchRequest);

      expect(result.pagination.has_more).toBe(true);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.page_size).toBe(25);
    });
  });
});
