import { describe, expect, it } from 'vitest';
import type { FileRouteTypes } from '@/routeTree.gen';
import {
  assetParamsToRoute,
  assetParamsToRoutePath,
  createRouteBuilder,
} from './assetParamsToRoute';

type RouteFilePaths = FileRouteTypes['to'];

describe('assetParamsToRoute', () => {
  describe('RouteBuilder', () => {
    it('should build single asset routes correctly', () => {
      // Test single chat route
      const chatRoute = createRouteBuilder().withChat('chat-123').build();
      expect(chatRoute).toBe('/app/chats/$chatId');

      // Test single dashboard route
      const dashboardRoute = createRouteBuilder().withDashboard('dash-123').build();
      expect(dashboardRoute).toBe('/app/dashboards/$dashboardId');

      // Test single metric route
      const metricRoute = createRouteBuilder().withMetric('metric-123').build();
      expect(metricRoute).toBe('/app/metrics/$metricId');

      // Test single report route
      const reportRoute = createRouteBuilder().withReport('report-123').build();
      expect(reportRoute).toBe('/app/reports/$reportId');

      // Test single collection route
      const collectionRoute = createRouteBuilder().withCollection('collection-123').build();
      expect(collectionRoute).toBe('/app/collections/$collectionId');
    });

    it('should build chat combination routes correctly', () => {
      // Chat + Dashboard
      const chatDashRoute = createRouteBuilder()
        .withChat('chat-123')
        .withDashboard('dash-456')
        .build();
      expect(chatDashRoute).toBe('/app/chats/$chatId/dashboards/$dashboardId');

      // Chat + Metric
      const chatMetricRoute = createRouteBuilder()
        .withChat('chat-123')
        .withMetric('metric-456')
        .build();
      expect(chatMetricRoute).toBe('/app/chats/$chatId/metrics/$metricId');

      // Chat + Report
      const chatReportRoute = createRouteBuilder()
        .withChat('chat-123')
        .withReport('report-456')
        .build();
      expect(chatReportRoute).toBe('/app/chats/$chatId/reports/$reportId');

      // Chat + Dashboard + Metric
      const chatDashMetricRoute = createRouteBuilder()
        .withChat('chat-123')
        .withDashboard('dash-456')
        .withMetric('metric-789')
        .build();
      expect(chatDashMetricRoute).toBe(
        '/app/chats/$chatId/dashboards/$dashboardId/metrics/$metricId'
      );
    });

    it('should maintain parameter values in state', () => {
      const builder = createRouteBuilder()
        .withChat('chat-123')
        .withDashboard('dash-456')
        .withMetric('metric-789');

      const params = builder.getParams();
      expect(params).toEqual({
        chatId: 'chat-123',
        dashboardId: 'dash-456',
        metricId: 'metric-789',
      });
    });
  });

  describe('assetParamsToRoute function', () => {
    it('should handle chat asset type correctly', () => {
      // Chat only
      const chatRoute = assetParamsToRoute({
        assetType: 'chat',
        assetId: 'chat-123',
      });
      expect(chatRoute).toEqual({
        to: '/app/chats/$chatId',
        params: {
          chatId: 'chat-123',
        },
      });

      // Chat with dashboard
      const chatDashRoute = assetParamsToRoute({
        assetType: 'chat',
        assetId: 'chat-123',
        dashboardId: 'dash-456',
      });
      expect(chatDashRoute).toEqual({
        to: '/app/chats/$chatId/dashboards/$dashboardId',
        params: {
          chatId: 'chat-123',
          dashboardId: 'dash-456',
        },
      });

      // Chat with metric
      const chatMetricRoute = assetParamsToRoute({
        assetType: 'chat',
        assetId: 'chat-123',
        metricId: 'metric-456',
      });
      expect(chatMetricRoute).toEqual({
        to: '/app/chats/$chatId/metrics/$metricId',
        params: {
          chatId: 'chat-123',
          metricId: 'metric-456',
        },
      });

      // Chat with dashboard and metric
      const chatDashMetricRoute = assetParamsToRoute({
        assetType: 'chat',
        assetId: 'chat-123',
        dashboardId: 'dash-456',
        metricId: 'metric-789',
      });
      expect(chatDashMetricRoute).toEqual({
        to: '/app/chats/$chatId/dashboards/$dashboardId/metrics/$metricId',
        params: {
          chatId: 'chat-123',
          dashboardId: 'dash-456',
          metricId: 'metric-789',
        },
      });
    });

    it('should handle metric asset type correctly', () => {
      // Metric only
      const metricRoute = assetParamsToRoute({
        assetType: 'metric_file',
        assetId: 'metric-123',
      });
      expect(metricRoute).toEqual({
        to: '/app/metrics/$metricId',
        params: {
          metricId: 'metric-123',
        },
      });

      // Metric with chat
      const metricChatRoute = assetParamsToRoute({
        assetType: 'metric_file',
        assetId: 'metric-123',
        chatId: 'chat-456',
      });
      expect(metricChatRoute).toEqual({
        to: '/app/chats/$chatId/metrics/$metricId',
        params: {
          chatId: 'chat-456',
          metricId: 'metric-123',
        },
      });

      // Metric with chat and dashboard
      const metricChatDashRoute = assetParamsToRoute({
        assetType: 'metric_file',
        assetId: 'metric-123',
        chatId: 'chat-456',
        dashboardId: 'dash-789',
      });
      expect(metricChatDashRoute).toEqual({
        to: '/app/chats/$chatId/dashboards/$dashboardId/metrics/$metricId',
        params: {
          chatId: 'chat-456',
          dashboardId: 'dash-789',
          metricId: 'metric-123',
        },
      });
    });

    it('should handle dashboard asset type correctly', () => {
      // Dashboard only
      const dashRoute = assetParamsToRoute({
        assetType: 'dashboard_file',
        assetId: 'dash-123',
      });
      expect(dashRoute).toEqual({
        to: '/app/dashboards/$dashboardId',
        params: {
          dashboardId: 'dash-123',
        },
      });

      // Dashboard with chat
      const dashChatRoute = assetParamsToRoute({
        assetType: 'dashboard_file',
        assetId: 'dash-123',
        chatId: 'chat-456',
      });
      expect(dashChatRoute).toEqual({
        to: '/app/chats/$chatId/dashboards/$dashboardId',
        params: {
          chatId: 'chat-456',
          dashboardId: 'dash-123',
        },
      });

      // Dashboard with chat and metric
      const dashChatMetricRoute = assetParamsToRoute({
        assetType: 'dashboard_file',
        assetId: 'dash-123',
        chatId: 'chat-456',
        metricId: 'metric-789',
      });
      expect(dashChatMetricRoute).toEqual({
        to: '/app/chats/$chatId/dashboards/$dashboardId/metrics/$metricId',
        params: {
          chatId: 'chat-456',
          dashboardId: 'dash-123',
          metricId: 'metric-789',
        },
      });
    });

    it('should handle report asset type correctly', () => {
      // Report only
      const reportRoute = assetParamsToRoute({
        assetType: 'report_file',
        assetId: 'report-123',
      });
      expect(reportRoute).toEqual({
        to: '/app/reports/$reportId',
        params: {
          reportId: 'report-123',
        },
      });

      // Report with chat
      const reportChatRoute = assetParamsToRoute({
        assetType: 'report_file',
        assetId: 'report-123',
        chatId: 'chat-456',
      });
      expect(reportChatRoute).toEqual({
        to: '/app/chats/$chatId/reports/$reportId',
        params: {
          chatId: 'chat-456',
          reportId: 'report-123',
        },
      });
    });

    it('should handle collection asset type correctly', () => {
      // Collection only
      const collectionRoute = assetParamsToRoute({
        assetType: 'collection',
        assetId: 'collection-123',
      });
      expect(collectionRoute).toEqual({
        to: '/app/collections/$collectionId',
        params: {
          collectionId: 'collection-123',
        },
      });
    });
  });

  describe('Version number support', () => {
    it('should handle single asset with version number correctly', () => {
      // Metric with version number
      const metricWithVersion = assetParamsToRoute({
        assetType: 'metric_file',
        assetId: 'metric-123',
        versionNumber: 5,
      });
      expect(metricWithVersion).toEqual({
        to: '/app/metrics/$metricId',
        params: {
          metricId: 'metric-123',
        },
        search: {
          metric_version_number: 5,
        },
      });

      // Dashboard with version number
      const dashboardWithVersion = assetParamsToRoute({
        assetType: 'dashboard_file',
        assetId: 'dashboard-456',
        versionNumber: 3,
      });
      expect(dashboardWithVersion).toEqual({
        to: '/app/dashboards/$dashboardId',
        params: {
          dashboardId: 'dashboard-456',
        },
        search: {
          dashboard_version_number: 3,
        },
      });

      // Report with version number
      const reportWithVersion = assetParamsToRoute({
        assetType: 'report_file',
        assetId: 'report-789',
        versionNumber: 2,
      });
      expect(reportWithVersion).toEqual({
        to: '/app/reports/$reportId',
        params: {
          reportId: 'report-789',
        },
        search: {
          report_version_number: 2,
        },
      });
    });

    it('should handle dashboard with metric and multiple version numbers', () => {
      // Dashboard with metric only includes metric when there's a chat context
      const dashboardWithMetricAndVersions = assetParamsToRoute({
        assetType: 'dashboard_file',
        assetId: 'dashboard-123',
        metricId: 'metric-456',
        versionNumber: 4,
        metricVersionNumber: 7,
      });
      expect(dashboardWithMetricAndVersions).toEqual({
        to: '/app/dashboards/$dashboardId/metrics/$metricId',
        params: {
          dashboardId: 'dashboard-123',
          metricId: 'metric-456',
        },
        search: {
          dashboard_version_number: 4,
          metric_version_number: 7,
        },
      });
    });

    it('should handle chat with versioned child assets', () => {
      const chatWithVersionedAssets = assetParamsToRoute({
        assetType: 'chat',
        assetId: 'chat-789',
        dashboardId: 'dashboard-123',
        metricId: 'metric-456',
        dashboardVersionNumber: 2,
        metricVersionNumber: 9,
      });
      expect(chatWithVersionedAssets).toEqual({
        to: '/app/chats/$chatId/dashboards/$dashboardId/metrics/$metricId',
        params: {
          chatId: 'chat-789',
          dashboardId: 'dashboard-123',
          metricId: 'metric-456',
        },
        search: {
          dashboard_version_number: 2,
          metric_version_number: 9,
        },
      });
    });

    it('should handle report with chat and metric version numbers', () => {
      const reportWithChatAndMetricVersions = assetParamsToRoute({
        assetType: 'report_file',
        assetId: 'report-xyz',
        metricId: 'metric-def',
        versionNumber: 8,
        metricVersionNumber: 3,
      });
      expect(reportWithChatAndMetricVersions).toEqual({
        to: '/app/reports/$reportId/metrics/$metricId',
        params: {
          reportId: 'report-xyz',
          metricId: 'metric-def',
        },
        search: {
          report_version_number: 8,
          metric_version_number: 3,
        },
      });
    });
  });

  describe('Additional version number tests', () => {
    it('should handle RouteBuilder fluent API with version methods', () => {
      const routeWithVersions = createRouteBuilder()
        .withDashboard('dashboard-abc')
        .withMetric('metric-def')
        .withDashboardVersion(3)
        .withMetricVersion(7)
        .buildNavigationOptions();

      expect(routeWithVersions).toEqual({
        to: '/app/dashboards/$dashboardId/metrics/$metricId',
        params: {
          dashboardId: 'dashboard-abc',
          metricId: 'metric-def',
        },
        search: {
          dashboard_version_number: 3,
          metric_version_number: 7,
        },
      });

      // Test single metric with version
      const metricWithVersion = createRouteBuilder()
        .withMetric('metric-xyz')
        .withVersion(5)
        .buildNavigationOptions();

      expect(metricWithVersion).toEqual({
        to: '/app/metrics/$metricId',
        params: {
          metricId: 'metric-xyz',
        },
        search: {
          metric_version_number: 5,
        },
      });
    });
  });

  describe('Edge case version number tests', () => {
    it('should handle zero version numbers correctly', () => {
      // Version number 0 should be treated as valid (not falsy)
      const metricWithZeroVersion = assetParamsToRoute({
        assetType: 'metric_file',
        assetId: 'metric-zero',
        versionNumber: 0,
      });

      expect(metricWithZeroVersion).toEqual({
        to: '/app/metrics/$metricId',
        params: {
          metricId: 'metric-zero',
        },
        search: {
          metric_version_number: 0,
        },
      });

      // Multiple zero versions
      const chatWithZeroVersions = assetParamsToRoute({
        assetType: 'chat',
        assetId: 'chat-zero',
        dashboardId: 'dashboard-zero',
        metricId: 'metric-zero',
        dashboardVersionNumber: 0,
        metricVersionNumber: 0,
      });

      expect(chatWithZeroVersions).toEqual({
        to: '/app/chats/$chatId/dashboards/$dashboardId/metrics/$metricId',
        params: {
          chatId: 'chat-zero',
          dashboardId: 'dashboard-zero',
          metricId: 'metric-zero',
        },
        search: {
          dashboard_version_number: 0,
          metric_version_number: 0,
        },
      });
    });
  });

  describe('Reasoning route tests', () => {
    it('should handle reasoning asset type correctly', () => {
      // Basic reasoning route
      const reasoningRoute = assetParamsToRoute({
        assetType: 'reasoning',
        assetId: 'message-123',
        chatId: 'chat-456',
      });
      expect(reasoningRoute).toEqual({
        to: '/app/_app/_asset/chats/$chatId/reasoning/$messageId',
        params: {
          chatId: 'chat-456',
          messageId: 'message-123',
        },
      });
    });

    it('should handle reasoning route with different IDs', () => {
      const reasoningRoute = assetParamsToRoute({
        assetType: 'reasoning',
        assetId: 'reasoning-message-789',
        chatId: 'test-chat-abc',
      });
      expect(reasoningRoute).toEqual({
        to: '/app/_app/_asset/chats/$chatId/reasoning/$messageId',
        params: {
          chatId: 'test-chat-abc',
          messageId: 'reasoning-message-789',
        },
      });
    });

    it('should handle reasoning route with UUIDs', () => {
      const reasoningRoute = assetParamsToRoute({
        assetType: 'reasoning',
        assetId: '550e8400-e29b-41d4-a716-446655440000',
        chatId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      });
      expect(reasoningRoute).toEqual({
        to: '/app/_app/_asset/chats/$chatId/reasoning/$messageId',
        params: {
          chatId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
          messageId: '550e8400-e29b-41d4-a716-446655440000',
        },
      });
    });

    it('should handle reasoning route with special characters in IDs', () => {
      const reasoningRoute = assetParamsToRoute({
        assetType: 'reasoning',
        assetId: 'message-with-special-chars-123!@#',
        chatId: 'chat-with-special-chars-456!@#',
      });
      expect(reasoningRoute).toEqual({
        to: '/app/_app/_asset/chats/$chatId/reasoning/$messageId',
        params: {
          chatId: 'chat-with-special-chars-456!@#',
          messageId: 'message-with-special-chars-123!@#',
        },
      });
    });

    it('should work with assetParamsToRoutePath helper function', () => {
      const reasoningPath = assetParamsToRoutePath({
        assetType: 'reasoning',
        assetId: 'message-123',
        chatId: 'chat-456',
      });
      expect(reasoningPath).toBe('/app/_app/_asset/chats/$chatId/reasoning/$messageId');
    });
  });

  describe('Type safety tests', () => {
    it('should enforce type safety on routes', () => {
      // This is a compile-time test - these should all be valid RouteFilePaths
      const routes: RouteFilePaths[] = [
        createRouteBuilder().withChat('1').build(),
        createRouteBuilder().withDashboard('1').build(),
        createRouteBuilder().withMetric('1').build(),
        createRouteBuilder().withReport('1').build(),
        createRouteBuilder().withCollection('1').build(),
        createRouteBuilder().withChat('1').withDashboard('2').build(),
        createRouteBuilder().withChat('1').withMetric('2').build(),
        createRouteBuilder().withChat('1').withReport('2').build(),
        createRouteBuilder().withChat('1').withDashboard('2').withMetric('3').build(),
        createRouteBuilder().withChat('1').withReport('2').withMetric('3').build(),
        createRouteBuilder().withCollection('1').withChat('2').build(),
        createRouteBuilder().withCollection('1').withDashboard('2').build(),
        createRouteBuilder().withCollection('1').withMetric('2').build(),
        createRouteBuilder().withCollection('1').withChat('2').withDashboard('3').build(),
        createRouteBuilder().withCollection('1').withChat('2').withMetric('3').build(),
        createRouteBuilder().withCollection('1').withDashboard('2').withMetric('3').build(),
        createRouteBuilder()
          .withCollection('1')
          .withChat('2')
          .withDashboard('3')
          .withMetric('4')
          .build(),
      ];

      expect(routes).toBeDefined();
    });
  });
});
