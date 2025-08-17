import { describe, expect, it } from 'vitest';
import type { FileRouteTypes } from '@/routeTree.gen';
import { assetParamsToRoute, createRouteBuilder } from './assetParamsToRoute';

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
      expect(chatReportRoute).toBe('/app/chats/$chatId/report/$reportId');

      // Chat + Dashboard + Metric
      const chatDashMetricRoute = createRouteBuilder()
        .withChat('chat-123')
        .withDashboard('dash-456')
        .withMetric('metric-789')
        .build();
      expect(chatDashMetricRoute).toBe(
        '/app/chats/$chatId/dashboards/$dashboardId/metrics/$metricId'
      );

      // Chat + Report + Metric
      const chatReportMetricRoute = createRouteBuilder()
        .withChat('chat-123')
        .withReport('report-456')
        .withMetric('metric-789')
        .build();
      expect(chatReportMetricRoute).toBe('/app/chats/$chatId/report/$reportId/metrics/$metricId');
    });

    it('should build collection combination routes correctly', () => {
      // Collection + Chat
      const collectionChatRoute = createRouteBuilder()
        .withCollection('collection-123')
        .withChat('chat-456')
        .build();
      expect(collectionChatRoute).toBe('/app/collections/$collectionId/chats/$chatId');

      // Collection + Dashboard
      const collectionDashRoute = createRouteBuilder()
        .withCollection('collection-123')
        .withDashboard('dash-456')
        .build();
      expect(collectionDashRoute).toBe('/app/collections/$collectionId/dashboard/$dashboardId');

      // Collection + Metric
      const collectionMetricRoute = createRouteBuilder()
        .withCollection('collection-123')
        .withMetric('metric-456')
        .build();
      expect(collectionMetricRoute).toBe('/app/collections/$collectionId/metrics/$metricId');

      // Collection + Chat + Dashboard
      const collectionChatDashRoute = createRouteBuilder()
        .withCollection('collection-123')
        .withChat('chat-456')
        .withDashboard('dash-789')
        .build();
      expect(collectionChatDashRoute).toBe(
        '/app/collections/$collectionId/chats/$chatId/dashboards/$dashboardId'
      );

      // Collection + Chat + Metric
      const collectionChatMetricRoute = createRouteBuilder()
        .withCollection('collection-123')
        .withChat('chat-456')
        .withMetric('metric-789')
        .build();
      expect(collectionChatMetricRoute).toBe(
        '/app/collections/$collectionId/chats/$chatId/metrics/$metricId'
      );

      // Collection + Dashboard + Metric
      const collectionDashMetricRoute = createRouteBuilder()
        .withCollection('collection-123')
        .withDashboard('dash-456')
        .withMetric('metric-789')
        .build();
      expect(collectionDashMetricRoute).toBe(
        '/app/collections/$collectionId/dashboard/$dashboardId/metrics/$metricId'
      );

      // Collection + Chat + Dashboard + Metric
      const collectionChatDashMetricRoute = createRouteBuilder()
        .withCollection('collection-123')
        .withChat('chat-456')
        .withDashboard('dash-789')
        .withMetric('metric-012')
        .build();
      expect(collectionChatDashMetricRoute).toBe(
        '/app/collections/$collectionId/chats/$chatId/dashboards/$dashboardId/metrics/$metricId'
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
        assetType: 'metric',
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
        assetType: 'metric',
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
        assetType: 'metric',
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
        assetType: 'dashboard',
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
        assetType: 'dashboard',
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
        assetType: 'dashboard',
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
        assetType: 'report',
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
        assetType: 'report',
        assetId: 'report-123',
        chatId: 'chat-456',
      });
      expect(reportChatRoute).toEqual({
        to: '/app/chats/$chatId/report/$reportId',
        params: {
          chatId: 'chat-456',
          reportId: 'report-123',
        },
      });

      // Report with chat and metric
      const reportChatMetricRoute = assetParamsToRoute({
        assetType: 'report',
        assetId: 'report-123',
        chatId: 'chat-456',
        metricId: 'metric-789',
      });
      expect(reportChatMetricRoute).toEqual({
        to: '/app/chats/$chatId/report/$reportId/metrics/$metricId',
        params: {
          chatId: 'chat-456',
          reportId: 'report-123',
          metricId: 'metric-789',
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

      // Collection with chat
      const collectionChatRoute = assetParamsToRoute({
        assetType: 'collection',
        assetId: 'collection-123',
        chatId: 'chat-456',
      });
      expect(collectionChatRoute).toEqual({
        to: '/app/collections/$collectionId/chats/$chatId',
        params: {
          collectionId: 'collection-123',
          chatId: 'chat-456',
        },
      });

      // Collection with dashboard
      const collectionDashRoute = assetParamsToRoute({
        assetType: 'collection',
        assetId: 'collection-123',
        dashboardId: 'dash-456',
      });
      expect(collectionDashRoute).toEqual({
        to: '/app/collections/$collectionId/dashboard/$dashboardId',
        params: {
          collectionId: 'collection-123',
          dashboardId: 'dash-456',
        },
      });

      // Collection with metric
      const collectionMetricRoute = assetParamsToRoute({
        assetType: 'collection',
        assetId: 'collection-123',
        metricId: 'metric-456',
      });
      expect(collectionMetricRoute).toEqual({
        to: '/app/collections/$collectionId/metrics/$metricId',
        params: {
          collectionId: 'collection-123',
          metricId: 'metric-456',
        },
      });

      // Collection with chat and dashboard
      const collectionChatDashRoute = assetParamsToRoute({
        assetType: 'collection',
        assetId: 'collection-123',
        chatId: 'chat-456',
        dashboardId: 'dash-789',
      });
      expect(collectionChatDashRoute).toEqual({
        to: '/app/collections/$collectionId/chats/$chatId/dashboards/$dashboardId',
        params: {
          collectionId: 'collection-123',
          chatId: 'chat-456',
          dashboardId: 'dash-789',
        },
      });

      // Collection with chat and metric
      const collectionChatMetricRoute = assetParamsToRoute({
        assetType: 'collection',
        assetId: 'collection-123',
        chatId: 'chat-456',
        metricId: 'metric-789',
      });
      expect(collectionChatMetricRoute).toEqual({
        to: '/app/collections/$collectionId/chats/$chatId/metrics/$metricId',
        params: {
          collectionId: 'collection-123',
          chatId: 'chat-456',
          metricId: 'metric-789',
        },
      });

      // Collection with dashboard and metric
      const collectionDashMetricRoute = assetParamsToRoute({
        assetType: 'collection',
        assetId: 'collection-123',
        dashboardId: 'dash-456',
        metricId: 'metric-789',
      });
      expect(collectionDashMetricRoute).toEqual({
        to: '/app/collections/$collectionId/dashboard/$dashboardId/metrics/$metricId',
        params: {
          collectionId: 'collection-123',
          dashboardId: 'dash-456',
          metricId: 'metric-789',
        },
      });

      // Collection with chat, dashboard and metric
      const collectionChatDashMetricRoute = assetParamsToRoute({
        assetType: 'collection',
        assetId: 'collection-123',
        chatId: 'chat-456',
        dashboardId: 'dash-789',
        metricId: 'metric-012',
      });
      expect(collectionChatDashMetricRoute).toEqual({
        to: '/app/collections/$collectionId/chats/$chatId/dashboards/$dashboardId/metrics/$metricId',
        params: {
          collectionId: 'collection-123',
          chatId: 'chat-456',
          dashboardId: 'dash-789',
          metricId: 'metric-012',
        },
      });
    });
  });

  describe('Version number support', () => {
    it('should handle single asset with version number correctly', () => {
      // Metric with version number
      const metricWithVersion = assetParamsToRoute({
        assetType: 'metric',
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
        assetType: 'dashboard',
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
        assetType: 'report',
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
        assetType: 'dashboard',
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

    it('should handle collection with versioned child assets', () => {
      const collectionWithVersionedAssets = assetParamsToRoute({
        assetType: 'collection',
        assetId: 'collection-abc',
        chatId: 'chat-def',
        dashboardId: 'dashboard-ghi',
        metricId: 'metric-jkl',
        dashboardVersionNumber: 6,
        metricVersionNumber: 1,
      });
      expect(collectionWithVersionedAssets).toEqual({
        to: '/app/collections/$collectionId/chats/$chatId/dashboards/$dashboardId/metrics/$metricId',
        params: {
          collectionId: 'collection-abc',
          chatId: 'chat-def',
          dashboardId: 'dashboard-ghi',
          metricId: 'metric-jkl',
        },
        search: {
          dashboard_version_number: 6,
          metric_version_number: 1,
        },
      });
    });

    it('should handle report with chat and metric version numbers', () => {
      const reportWithChatAndMetricVersions = assetParamsToRoute({
        assetType: 'report',
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
