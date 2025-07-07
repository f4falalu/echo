import { describe, it, expect, vi, beforeEach } from 'vitest';
import { assetParamsToRoute } from './assetParamsToRoute';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';
import { createMetricRoute } from './createMetricRoute';
import { createDashboardRoute } from './createDashboardRoute';
import { createReasoningRoute } from './createReasoningRoute';
import { createDatasetRoute } from './createDatasetRoute';

vi.mock('@/routes/busterRoutes', async () => {
  const actual = await vi.importActual('@/routes/busterRoutes');
  return {
    ...actual,
    createBusterRoute: vi.fn()
  };
});

vi.mock('./createMetricRoute', () => ({
  createMetricRoute: vi.fn()
}));

vi.mock('./createDashboardRoute', () => ({
  createDashboardRoute: vi.fn()
}));

vi.mock('./createReasoningRoute', () => ({
  createReasoningRoute: vi.fn()
}));

vi.mock('./createDatasetRoute', () => ({
  createDatasetRoute: vi.fn()
}));

describe('assetParamsToRoute', () => {
  const mockCreateBusterRoute = vi.mocked(createBusterRoute);
  const mockCreateMetricRoute = vi.mocked(createMetricRoute);
  const mockCreateDashboardRoute = vi.mocked(createDashboardRoute);
  const mockCreateReasoningRoute = vi.mocked(createReasoningRoute);
  const mockCreateDatasetRoute = vi.mocked(createDatasetRoute);

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default mock returns
    mockCreateBusterRoute.mockReturnValue('/mock/buster/route');
    mockCreateMetricRoute.mockReturnValue('/mock/metric/route');
    mockCreateDashboardRoute.mockReturnValue('/mock/dashboard/route');
    mockCreateReasoningRoute.mockReturnValue('/mock/reasoning/route');
    mockCreateDatasetRoute.mockReturnValue('/mock/dataset/route');
  });

  describe('when no assetId is provided', () => {
    it('should return chat route when chatId is provided', () => {
      const result = assetParamsToRoute({
        assetId: undefined,
        chatId: 'chat-123',
        type: 'todo'
      });

      expect(mockCreateBusterRoute).toHaveBeenCalledWith({
        route: BusterRoutes.APP_CHAT_ID,
        chatId: 'chat-123'
      });
      expect(result).toBe('/mock/buster/route');
    });

    it('should return empty string when neither assetId nor chatId is provided', () => {
      const result = assetParamsToRoute({
        assetId: undefined,
        chatId: undefined,
        type: 'todo'
      });

      expect(result).toBe('');
      expect(mockCreateBusterRoute).not.toHaveBeenCalled();
    });
  });

  describe('when assetId is provided', () => {
    describe('metric type', () => {
      it('should call createMetricRoute with correct parameters', () => {
        const result = assetParamsToRoute({
          assetId: 'metric-123',
          chatId: 'chat-456',
          type: 'metric',
          versionNumber: 2,
          page: 'chart',
          secondaryView: 'chart-edit'
        });

        expect(mockCreateMetricRoute).toHaveBeenCalledWith({
          assetId: 'metric-123',
          chatId: 'chat-456',
          secondaryView: 'chart-edit',
          metricVersionNumber: 2,
          page: 'chart'
        });
        expect(result).toBe('/mock/metric/route');
      });

      it('should handle metric without optional parameters', () => {
        const result = assetParamsToRoute({
          assetId: 'metric-123',
          chatId: undefined,
          type: 'metric'
        });

        expect(mockCreateMetricRoute).toHaveBeenCalledWith({
          assetId: 'metric-123',
          chatId: undefined,
          secondaryView: undefined,
          versionNumber: undefined,
          page: undefined
        });
        expect(result).toBe('/mock/metric/route');
      });
    });

    describe('dashboard type', () => {
      it('should call createDashboardRoute with correct parameters', () => {
        const result = assetParamsToRoute({
          assetId: 'dashboard-123',
          chatId: 'chat-456',
          type: 'dashboard',
          dashboardVersionNumber: 3,
          page: 'file',
          secondaryView: 'version-history'
        });

        expect(mockCreateDashboardRoute).toHaveBeenCalledWith({
          assetId: 'dashboard-123',
          chatId: 'chat-456',
          dashboardVersionNumber: 3,
          page: 'file',
          secondaryView: 'version-history'
        });
        expect(result).toBe('/mock/dashboard/route');
      });

      it('should handle dashboard without optional parameters', () => {
        const result = assetParamsToRoute({
          assetId: 'dashboard-123',
          chatId: undefined,
          type: 'dashboard'
        });

        expect(mockCreateDashboardRoute).toHaveBeenCalledWith({
          assetId: 'dashboard-123',
          chatId: undefined,
          versionNumber: undefined,
          page: undefined,
          secondaryView: undefined
        });
        expect(result).toBe('/mock/dashboard/route');
      });
    });

    describe('reasoning type', () => {
      it('should call createReasoningRoute with correct parameters', () => {
        const result = assetParamsToRoute({
          assetId: 'reasoning-123',
          chatId: 'chat-456',
          type: 'reasoning'
        });

        expect(mockCreateReasoningRoute).toHaveBeenCalledWith({
          assetId: 'reasoning-123',
          chatId: 'chat-456'
        });
        expect(result).toBe('/mock/reasoning/route');
      });

      it('should handle reasoning without chatId', () => {
        const result = assetParamsToRoute({
          assetId: 'reasoning-123',
          chatId: undefined,
          type: 'reasoning'
        });

        expect(mockCreateReasoningRoute).toHaveBeenCalledWith({
          assetId: 'reasoning-123',
          chatId: undefined
        });
        expect(result).toBe('/mock/reasoning/route');
      });
    });

    describe('dataset type', () => {
      it('should call createDatasetRoute with correct parameters', () => {
        const result = assetParamsToRoute({
          assetId: 'dataset-123',
          chatId: 'chat-456',
          type: 'dataset'
        });

        expect(mockCreateDatasetRoute).toHaveBeenCalledWith({
          datasetId: 'dataset-123',
          chatId: 'chat-456'
        });
        expect(result).toBe('/mock/dataset/route');
      });

      it('should handle dataset without chatId', () => {
        const result = assetParamsToRoute({
          assetId: 'dataset-123',
          chatId: undefined,
          type: 'dataset'
        });

        expect(mockCreateDatasetRoute).toHaveBeenCalledWith({
          datasetId: 'dataset-123',
          chatId: undefined
        });
        expect(result).toBe('/mock/dataset/route');
      });
    });

    describe('collection type', () => {
      it('should call createBusterRoute for collection', () => {
        const result = assetParamsToRoute({
          assetId: 'collection-123',
          chatId: undefined,
          type: 'collection'
        });

        expect(mockCreateBusterRoute).toHaveBeenCalledWith({
          route: BusterRoutes.APP_COLLECTIONS_ID,
          collectionId: 'collection-123'
        });
        expect(result).toBe('/mock/buster/route');
      });
    });

    describe('term type', () => {
      it('should call createBusterRoute for term', () => {
        const result = assetParamsToRoute({
          assetId: 'term-123',
          chatId: undefined,
          type: 'term'
        });

        expect(mockCreateBusterRoute).toHaveBeenCalledWith({
          route: BusterRoutes.APP_TERMS_ID,
          termId: 'term-123'
        });
        expect(result).toBe('/mock/buster/route');
      });
    });

    describe('unimplemented types', () => {
      it('should return empty string for todo type', () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const result = assetParamsToRoute({
          assetId: 'todo-123',
          chatId: undefined,
          type: 'todo'
        });

        expect(result).toBe('');

        consoleSpy.mockRestore();
      });

      it('should return empty string for agent-action type', () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const result = assetParamsToRoute({
          assetId: 'action-123',
          chatId: undefined,
          type: 'agent-action'
        });

        expect(result).toBe('');

        consoleSpy.mockRestore();
      });

      it('should return empty string for topic type', () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const result = assetParamsToRoute({
          assetId: 'topic-123',
          chatId: undefined,
          type: 'topic'
        });

        expect(result).toBe('');

        consoleSpy.mockRestore();
      });

      it('should return empty string for value type', () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const result = assetParamsToRoute({
          assetId: 'value-123',
          chatId: undefined,
          type: 'value'
        });

        expect(result).toBe('');

        consoleSpy.mockRestore();
      });

      it('should return empty string for empty type', () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const result = assetParamsToRoute({
          assetId: 'empty-123',
          chatId: undefined,
          type: 'empty'
        });

        expect(result).toBe('');

        consoleSpy.mockRestore();
      });
    });
  });

  describe('edge cases', () => {
    it('should handle undefined secondaryView', () => {
      const result = assetParamsToRoute({
        assetId: 'metric-123',
        chatId: 'chat-456',
        type: 'metric',
        secondaryView: undefined
      });

      expect(mockCreateMetricRoute).toHaveBeenCalledWith({
        assetId: 'metric-123',
        chatId: 'chat-456',
        secondaryView: undefined,
        versionNumber: undefined,
        page: undefined
      });
      expect(result).toBe('/mock/metric/route');
    });

    it('should handle valid secondaryView', () => {
      const result = assetParamsToRoute({
        assetId: 'metric-123',
        chatId: 'chat-456',
        type: 'metric',
        secondaryView: 'chart-edit'
      });

      expect(mockCreateMetricRoute).toHaveBeenCalledWith({
        assetId: 'metric-123',
        chatId: 'chat-456',
        secondaryView: 'chart-edit',
        versionNumber: undefined,
        page: undefined
      });
      expect(result).toBe('/mock/metric/route');
    });
  });
});
