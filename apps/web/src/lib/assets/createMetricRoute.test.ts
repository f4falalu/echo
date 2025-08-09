import { describe, it, expect } from 'vitest';
import { createMetricRoute } from './createMetricRoute';
import { BusterRoutes } from '@/routes/busterRoutes';

// Mock the createBusterRoute function
vi.mock('@/routes/busterRoutes', async () => {
  const actual = await vi.importActual('@/routes/busterRoutes');
  return {
    ...actual
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

      expect(result).toContain(
        '/app/chats/chat-456/metrics/metric-123/chart?secondary_view=chart-edit&metric_version_number=5'
      );
    });

    it('should create chat metric chart route with version number only', () => {
      const result = createMetricRoute({
        assetId: 'metric-123',
        chatId: 'chat-456',
        versionNumber: 3,
        page: 'chart'
      });

      expect(result).toContain(
        '/app/chats/chat-456/metrics/metric-123/chart?metric_version_number=3'
      );
    });

    it('should create chat metric chart route with version history secondary view', () => {
      const result = createMetricRoute({
        assetId: 'metric-123',
        chatId: 'chat-456',
        secondaryView: 'version-history',
        page: 'chart'
      });

      expect(result).toContain(
        '/app/chats/chat-456/metrics/metric-123/chart?secondary_view=version-history'
      );
    });

    it('should create chat metric chart route with minimal parameters', () => {
      const result = createMetricRoute({
        assetId: 'metric-123',
        chatId: 'chat-456',
        page: 'chart'
      });

      expect(result).toContain('/app/chats/chat-456/metrics/metric-123/chart');
    });

    it('should create non-chat metric chart route with version number', () => {
      const result = createMetricRoute({
        assetId: 'metric-123',
        versionNumber: 7,
        page: 'chart'
      });

      expect(result).toContain('/app/metrics/metric-123/chart?metric_version_number=7');
    });

    it('should create non-chat metric chart route with chart-edit secondary view', () => {
      const result = createMetricRoute({
        assetId: 'metric-123',
        secondaryView: 'chart-edit',
        page: 'chart'
      });

      expect(result).toContain('/app/metrics/metric-123/chart?secondary_view=chart-edit');
    });

    it('should create non-chat metric chart route with minimal parameters', () => {
      const result = createMetricRoute({
        assetId: 'metric-123',
        page: 'chart'
      });

      expect(result).toContain('/app/metrics/metric-123/chart');
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

      expect(result).toContain(
        '/app/chats/chat-456/metrics/metric-123/results?metric_version_number=2'
      );
    });

    it('should create non-chat metric results route with version number', () => {
      const result = createMetricRoute({
        assetId: 'metric-123',
        versionNumber: 4,
        page: 'results'
      });

      expect(result).toContain('/app/metrics/metric-123/results?metric_version_number=4');
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

      expect(result).toContain(
        '/app/chats/chat-456/metrics/metric-123/sql?metric_version_number=6'
      );
    });

    it('should create chat metric SQL route without version number', () => {
      const result = createMetricRoute({
        assetId: 'metric-123',
        chatId: 'chat-456',
        page: 'sql'
      });

      expect(result).toContain('/app/chats/chat-456/metrics/metric-123/sql');
    });

    it('should create non-chat metric SQL route with version number', () => {
      const result = createMetricRoute({
        assetId: 'metric-123',
        versionNumber: 8,
        page: 'sql'
      });

      expect(result).toContain('/app/metrics/metric-123/sql?metric_version_number=8');
    });

    it('should create non-chat metric SQL route without version number', () => {
      const result = createMetricRoute({
        assetId: 'metric-123',
        page: 'sql'
      });

      expect(result).toContain('/app/metrics/metric-123/sql');
    });
  });

  describe('Edge cases and defaults', () => {
    it('should use default page value when not specified', () => {
      const result = createMetricRoute({
        assetId: 'metric-123',
        chatId: 'chat-456',
        page: 'chart'
      });

      expect(result).toContain('/app/chats/chat-456/metrics/metric-123/chart');
    });

    it('should handle undefined secondary view in chat context', () => {
      const result = createMetricRoute({
        assetId: 'metric-123',
        chatId: 'chat-456',
        secondaryView: undefined,
        page: 'chart'
      });

      expect(result).toContain('/app/chats/chat-456/metrics/metric-123/chart');
    });

    it('should handle undefined secondary view in non-chat context', () => {
      const result = createMetricRoute({
        assetId: 'metric-123',
        secondaryView: undefined,
        page: 'chart'
      });

      expect(result).toContain('/app/metrics/metric-123/chart');
    });
  });

  describe('Dashboard route tests', () => {
    describe('Dashboard with chart page', () => {
      it('should create dashboard metric chart route with all parameters', () => {
        const result = createMetricRoute({
          assetId: 'metric-123',
          chatId: 'chat-456',
          dashboardId: 'dashboard-789',
          secondaryView: 'chart-edit',
          versionNumber: 5,
          page: 'chart'
        });

        expect(result).toContain(
          '/app/chats/chat-456/dashboards/dashboard-789/metrics/metric-123/chart?secondary_view=chart-edit&metric_version_number=5'
        );
      });

      it('should create dashboard metric chart route with version history view', () => {
        const result = createMetricRoute({
          assetId: 'metric-123',
          chatId: 'chat-456',
          dashboardId: 'dashboard-789',
          secondaryView: 'version-history',
          page: 'chart'
        });

        expect(result).toContain(
          '/app/chats/chat-456/dashboards/dashboard-789/metrics/metric-123/chart?secondary_view=version-history'
        );
      });

      it('should prioritize dashboard route over regular chat route', () => {
        const result = createMetricRoute({
          assetId: 'metric-123',
          chatId: 'chat-456',
          dashboardId: 'dashboard-789',
          page: 'chart'
        });

        expect(result).toContain(
          '/app/chats/chat-456/dashboards/dashboard-789/metrics/metric-123/chart'
        );
        expect(result).not.toContain('/app/chats/chat-456/metrics/metric-123/chart');
      });
    });

    describe('Dashboard with results page', () => {
      it('should create dashboard metric results route', () => {
        const result = createMetricRoute({
          assetId: 'metric-123',
          chatId: 'chat-456',
          dashboardId: 'dashboard-789',
          versionNumber: 3,
          page: 'results'
        });

        expect(result).toContain(
          '/app/chats/chat-456/dashboards/dashboard-789/metrics/metric-123/results?metric_version_number=3'
        );
      });

      it('should require both chatId and dashboardId for dashboard results route', () => {
        const result = createMetricRoute({
          assetId: 'metric-123',
          dashboardId: 'dashboard-789',
          page: 'results'
        });

        // Should fall back to non-chat route when chatId is missing
        expect(result).toContain('/app/metrics/metric-123/results');
        expect(result).not.toContain('dashboardId');
      });
    });

    describe('Dashboard with SQL page', () => {
      it('should create dashboard metric SQL route', () => {
        const result = createMetricRoute({
          assetId: 'metric-123',
          chatId: 'chat-456',
          dashboardId: 'dashboard-789',
          versionNumber: 7,
          page: 'sql'
        });

        expect(result).toContain(
          '/app/chats/chat-456/dashboards/dashboard-789/metrics/metric-123/sql?metric_version_number=7'
        );
      });

      it('should create dashboard metric SQL route without version number', () => {
        const result = createMetricRoute({
          assetId: 'metric-123',
          chatId: 'chat-456',
          dashboardId: 'dashboard-789',
          page: 'sql'
        });

        expect(result).toContain(
          '/app/chats/chat-456/dashboards/dashboard-789/metrics/metric-123/sql'
        );
      });
    });

    describe('Dashboard edge cases', () => {
      it('should handle dashboardId without chatId for chart page', () => {
        const result = createMetricRoute({
          assetId: 'metric-123',
          dashboardId: 'dashboard-789',
          page: 'chart'
        });

        // Should fall back to non-chat route
        expect(result).toContain('/app/metrics/metric-123/chart');
        expect(result).not.toContain('dashboardId');
      });

      it('should handle dashboardId without chatId for sql page', () => {
        const result = createMetricRoute({
          assetId: 'metric-123',
          dashboardId: 'dashboard-789',
          page: 'sql'
        });

        // Should fall back to non-chat route
        expect(result).toContain('/app/metrics/metric-123/sql');
        expect(result).not.toContain('dashboardId');
      });
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

      expect(result).toContain('/app/metrics/metric-123/chart');
    });

    it('should handle 1 version number', () => {
      const result = createMetricRoute({
        assetId: 'metric-123',
        chatId: 'chat-456',
        versionNumber: 1,
        page: 'chart'
      });

      expect(result).toContain(
        '/app/chats/chat-456/metrics/metric-123/chart?metric_version_number=1'
      );
    });

    it('should handle secondary with sql', () => {
      const result = createMetricRoute({
        assetId: 'metric-123',
        chatId: 'chat-456',
        secondaryView: 'version-history',
        page: 'sql'
      });

      expect(result).toContain(
        '/app/chats/chat-456/metrics/metric-123/sql?secondary_view=version-history'
      );
    });
  });

  describe('Report route tests', () => {
    describe('Report with chart page', () => {
      it('should create report metric chart route with all parameters', () => {
        const result = createMetricRoute({
          assetId: 'metric-123',
          chatId: 'chat-456',
          reportId: 'report-789',
          secondaryView: 'chart-edit',
          metricVersionNumber: 5,
          reportVersionNumber: 2,
          page: 'chart'
        });

        expect(result).toContain(
          '/app/chats/chat-456/reports/report-789/metrics/metric-123/chart?secondary_view=chart-edit&metric_version_number=5&report_version_number=2'
        );
      });

      it('should create report metric chart route with version history view', () => {
        const result = createMetricRoute({
          assetId: 'metric-123',
          chatId: 'chat-456',
          reportId: 'report-789',
          secondaryView: 'version-history',
          page: 'chart'
        });

        expect(result).toContain(
          '/app/chats/chat-456/reports/report-789/metrics/metric-123/chart?secondary_view=version-history'
        );
      });

      it('should create report metric chart route with minimal parameters', () => {
        const result = createMetricRoute({
          assetId: 'metric-123',
          chatId: 'chat-456',
          reportId: 'report-789',
          page: 'chart'
        });

        expect(result).toContain('/app/chats/chat-456/reports/report-789/metrics/metric-123/chart');
      });

      it('should prioritize report route over regular chat route', () => {
        const result = createMetricRoute({
          assetId: 'metric-123',
          chatId: 'chat-456',
          reportId: 'report-789',
          page: 'chart'
        });

        expect(result).toContain('/app/chats/chat-456/reports/report-789/metrics/metric-123/chart');
        expect(result).not.toContain('/app/chats/chat-456/metrics/metric-123/chart');
      });

      it('should prioritize dashboard route over report route', () => {
        const result = createMetricRoute({
          assetId: 'metric-123',
          chatId: 'chat-456',
          dashboardId: 'dashboard-456',
          reportId: 'report-789',
          page: 'chart'
        });

        expect(result).toContain(
          '/app/chats/chat-456/dashboards/dashboard-456/metrics/metric-123/chart'
        );
        expect(result).not.toContain('reports');
      });
    });

    describe('Report with results page', () => {
      it('should create report metric results route with version numbers', () => {
        const result = createMetricRoute({
          assetId: 'metric-123',
          chatId: 'chat-456',
          reportId: 'report-789',
          metricVersionNumber: 3,
          reportVersionNumber: 1,
          page: 'results'
        });

        expect(result).toContain(
          '/app/chats/chat-456/reports/report-789/metrics/metric-123/results?metric_version_number=3&report_version_number=1'
        );
      });

      it('should create report metric results route with minimal parameters', () => {
        const result = createMetricRoute({
          assetId: 'metric-123',
          chatId: 'chat-456',
          reportId: 'report-789',
          page: 'results'
        });

        expect(result).toContain(
          '/app/chats/chat-456/reports/report-789/metrics/metric-123/results'
        );
      });

      it('should require both chatId and reportId for report results route', () => {
        const result = createMetricRoute({
          assetId: 'metric-123',
          reportId: 'report-789',
          page: 'results'
        });

        // Should fall back to non-chat route when chatId is missing
        expect(result).toContain('/app/metrics/metric-123/results');
        expect(result).not.toContain('reports');
      });
    });

    describe('Report with SQL page', () => {
      it('should create report metric SQL route with version numbers', () => {
        const result = createMetricRoute({
          assetId: 'metric-123',
          chatId: 'chat-456',
          reportId: 'report-789',
          metricVersionNumber: 7,
          reportVersionNumber: 3,
          page: 'sql'
        });

        expect(result).toContain(
          '/app/chats/chat-456/reports/report-789/metrics/metric-123/sql?metric_version_number=7&report_version_number=3'
        );
      });

      it('should create report metric SQL route without version number', () => {
        const result = createMetricRoute({
          assetId: 'metric-123',
          chatId: 'chat-456',
          reportId: 'report-789',
          page: 'sql'
        });

        expect(result).toContain('/app/chats/chat-456/reports/report-789/metrics/metric-123/sql');
      });
    });

    describe('Report edge cases', () => {
      it('should handle reportId without chatId for chart page', () => {
        const result = createMetricRoute({
          assetId: 'metric-123',
          reportId: 'report-789',
          page: 'chart'
        });

        // Should fall back to non-chat route
        expect(result).toContain('/app/metrics/metric-123/chart');
        expect(result).not.toContain('reports');
      });

      it('should handle reportId without chatId for sql page', () => {
        const result = createMetricRoute({
          assetId: 'metric-123',
          reportId: 'report-789',
          page: 'sql'
        });

        // Should fall back to non-chat route
        expect(result).toContain('/app/metrics/metric-123/sql');
        expect(result).not.toContain('reports');
      });

      it('should handle both dashboardId and reportId with missing chatId', () => {
        const result = createMetricRoute({
          assetId: 'metric-123',
          dashboardId: 'dashboard-456',
          reportId: 'report-789',
          page: 'chart'
        });

        // Should fall back to non-chat route
        expect(result).toContain('/app/metrics/metric-123/chart');
        expect(result).not.toContain('dashboards');
        expect(result).not.toContain('reports');
      });

      it('should use versionNumber as fallback for metricVersionNumber in report context', () => {
        const result = createMetricRoute({
          assetId: 'metric-123',
          chatId: 'chat-456',
          reportId: 'report-789',
          versionNumber: 4,
          page: 'chart'
        });

        expect(result).toContain(
          '/app/chats/chat-456/reports/report-789/metrics/metric-123/chart?metric_version_number=4'
        );
      });

      it('should prefer metricVersionNumber over versionNumber in report context', () => {
        const result = createMetricRoute({
          assetId: 'metric-123',
          chatId: 'chat-456',
          reportId: 'report-789',
          metricVersionNumber: 6,
          versionNumber: 4,
          page: 'chart'
        });

        expect(result).toContain(
          '/app/chats/chat-456/reports/report-789/metrics/metric-123/chart?metric_version_number=6'
        );
        expect(result).not.toContain('metric_version_number=4');
      });
    });
  });
});
