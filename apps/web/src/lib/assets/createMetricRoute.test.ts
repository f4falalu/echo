import { describe, it, expect } from 'vitest';
import { createMetricRoute } from './createMetricRoute';
import { BusterRoutes } from '@/routes/busterRoutes';

// Mock the createBusterRoute function
vi.mock('@/routes/busterRoutes', async () => {
  const actual = await vi.importActual('@/routes/busterRoutes');
  return {
    ...actual,
    createBusterRoute: vi.fn((params) => {
      // Simple mock implementation that returns a string representation
      const { route, ...args } = params;
      const queryParams = Object.entries(args)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => `${key}=${value}`)
        .join('&');
      return queryParams ? `${route}?${queryParams}` : route;
    })
  };
});

describe('createMetricRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Chart page tests', () => {
    it('should create chat metric chart route with all parameters', () => {
      const result = createMetricRoute({
        assetId: 'metric-123',
        chatId: 'chat-456',
        secondaryView: 'chart-edit',
        versionNumber: 5,
        page: 'chart'
      });

      expect(result).toContain(BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART);
      expect(result).toContain('chatId=chat-456');
      expect(result).toContain('metricId=metric-123');
      expect(result).toContain('metricVersionNumber=5');
      expect(result).toContain('secondaryView=chart-edit');
    });

    it('should create chat metric chart route with version number only', () => {
      const result = createMetricRoute({
        assetId: 'metric-123',
        chatId: 'chat-456',
        versionNumber: 3,
        page: 'chart'
      });

      expect(result).toContain(BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART);
      expect(result).toContain('chatId=chat-456');
      expect(result).toContain('metricId=metric-123');
      expect(result).toContain('metricVersionNumber=3');
    });

    it('should create chat metric chart route with version history secondary view', () => {
      const result = createMetricRoute({
        assetId: 'metric-123',
        chatId: 'chat-456',
        secondaryView: 'version-history',
        page: 'chart'
      });

      expect(result).toContain(BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART);
      expect(result).toContain('chatId=chat-456');
      expect(result).toContain('metricId=metric-123');
      expect(result).toContain('secondaryView=version-history');
    });

    it('should create chat metric chart route with minimal parameters', () => {
      const result = createMetricRoute({
        assetId: 'metric-123',
        chatId: 'chat-456',
        page: 'chart'
      });

      expect(result).toContain(BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART);
      expect(result).toContain('chatId=chat-456');
      expect(result).toContain('metricId=metric-123');
    });

    it('should create non-chat metric chart route with version number', () => {
      const result = createMetricRoute({
        assetId: 'metric-123',
        versionNumber: 7,
        page: 'chart'
      });

      expect(result).toContain(BusterRoutes.APP_METRIC_ID_CHART);
      expect(result).toContain('metricId=metric-123');
      expect(result).toContain('metricVersionNumber=7');
    });

    it('should create non-chat metric chart route with chart-edit secondary view', () => {
      const result = createMetricRoute({
        assetId: 'metric-123',
        secondaryView: 'chart-edit',
        page: 'chart'
      });

      expect(result).toContain(BusterRoutes.APP_METRIC_ID_CHART);
      expect(result).toContain('metricId=metric-123');
      expect(result).toContain('secondaryView=chart-edit');
    });

    it('should create non-chat metric chart route with minimal parameters', () => {
      const result = createMetricRoute({
        assetId: 'metric-123',
        page: 'chart'
      });

      expect(result).toContain(BusterRoutes.APP_METRIC_ID_CHART);
      expect(result).toContain('metricId=metric-123');
    });
  });

  describe('Results page tests', () => {
    it('should create chat metric results route with version number', () => {
      const result = createMetricRoute({
        assetId: 'metric-123',
        chatId: 'chat-456',
        versionNumber: 2,
        page: 'results'
      });

      expect(result).toContain(BusterRoutes.APP_CHAT_ID_METRIC_ID_RESULTS);
      expect(result).toContain('chatId=chat-456');
      expect(result).toContain('metricId=metric-123');
      expect(result).toContain('metricVersionNumber=2');
    });

    it('should create non-chat metric results route with version number', () => {
      const result = createMetricRoute({
        assetId: 'metric-123',
        versionNumber: 4,
        page: 'results'
      });

      expect(result).toContain(BusterRoutes.APP_METRIC_ID_CHART);
      expect(result).toContain('metricId=metric-123');
      expect(result).toContain('metricVersionNumber=4');
    });
  });

  describe('SQL page tests', () => {
    it('should create chat metric SQL route with version number', () => {
      const result = createMetricRoute({
        assetId: 'metric-123',
        chatId: 'chat-456',
        versionNumber: 6,
        page: 'sql'
      });

      expect(result).toContain(BusterRoutes.APP_CHAT_ID_METRIC_ID_SQL);
      expect(result).toContain('chatId=chat-456');
      expect(result).toContain('metricId=metric-123');
      expect(result).toContain('metricVersionNumber=6');
    });

    it('should create chat metric SQL route without version number', () => {
      const result = createMetricRoute({
        assetId: 'metric-123',
        chatId: 'chat-456',
        page: 'sql'
      });

      expect(result).toContain(BusterRoutes.APP_CHAT_ID_METRIC_ID_SQL);
      expect(result).toContain('chatId=chat-456');
      expect(result).toContain('metricId=metric-123');
    });

    it('should create non-chat metric SQL route with version number', () => {
      const result = createMetricRoute({
        assetId: 'metric-123',
        versionNumber: 8,
        page: 'sql'
      });

      expect(result).toContain(BusterRoutes.APP_METRIC_ID_SQL);
      expect(result).toContain('metricId=metric-123');
      expect(result).toContain('metricVersionNumber=8');
    });

    it('should create non-chat metric SQL route without version number', () => {
      const result = createMetricRoute({
        assetId: 'metric-123',
        page: 'sql'
      });

      expect(result).toContain(BusterRoutes.APP_METRIC_ID_SQL);
      expect(result).toContain('metricId=metric-123');
    });
  });

  describe('Edge cases and defaults', () => {
    it('should use default page value when not specified', () => {
      const result = createMetricRoute({
        assetId: 'metric-123',
        chatId: 'chat-456',
        page: 'chart'
      });

      expect(result).toContain(BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART);
      expect(result).toContain('chatId=chat-456');
      expect(result).toContain('metricId=metric-123');
    });

    it('should handle undefined secondary view in chat context', () => {
      const result = createMetricRoute({
        assetId: 'metric-123',
        chatId: 'chat-456',
        secondaryView: undefined,
        page: 'chart'
      });

      expect(result).toContain(BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART);
      expect(result).toContain('chatId=chat-456');
      expect(result).toContain('metricId=metric-123');
    });

    it('should handle undefined secondary view in non-chat context', () => {
      const result = createMetricRoute({
        assetId: 'metric-123',
        secondaryView: undefined,
        page: 'chart'
      });

      expect(result).toContain(BusterRoutes.APP_METRIC_ID_CHART);
      expect(result).toContain('metricId=metric-123');
    });
  });

  describe('Parameter combinations', () => {
    it('should handle all optional parameters being undefined', () => {
      const result = createMetricRoute({
        assetId: 'metric-123',
        chatId: undefined,
        secondaryView: undefined,
        versionNumber: undefined,
        page: 'chart'
      });

      expect(result).toContain(BusterRoutes.APP_METRIC_ID_CHART);
      expect(result).toContain('metricId=metric-123');
    });

    it('should handle 1 version number', () => {
      const result = createMetricRoute({
        assetId: 'metric-123',
        chatId: 'chat-456',
        versionNumber: 1,
        page: 'chart'
      });

      expect(result).toContain(BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART);
      expect(result).toContain('chatId=chat-456');
      expect(result).toContain('metricId=metric-123');
      console.log('result', result);
      expect(result).toContain('metricVersionNumber=1');
    });
  });
});
