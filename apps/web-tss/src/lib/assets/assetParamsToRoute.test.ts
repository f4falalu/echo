import { describe, expect, it } from 'vitest';
import type { FileRouteTypes } from '@/routeTree.gen';
import { assetParamsToRoute, createRouteBuilder } from './assetParamsToRoute';

type RouteFilePaths = FileRouteTypes['id'];

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
    });

    it('should build chat combination routes correctly', () => {
      // Chat + Dashboard
      const chatDashRoute = createRouteBuilder()
        .withChat('chat-123')
        .withDashboard('dash-456')
        .build();
      expect(chatDashRoute).toBe('/app/chats/$chatId/dashboard/$dashboardId');

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
        '/app/chats/$chatId/dashboard/$dashboardId/metrics/$metricId'
      );

      // Chat + Report + Metric
      const chatReportMetricRoute = createRouteBuilder()
        .withChat('chat-123')
        .withReport('report-456')
        .withMetric('metric-789')
        .build();
      expect(chatReportMetricRoute).toBe('/app/chats/$chatId/report/$reportId/metrics/$metricId');
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
        to: '/app/chats/$chatId/dashboard/$dashboardId',
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
        to: '/app/chats/$chatId/dashboard/$dashboardId/metrics/$metricId',
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
      expect(metricRoute).toBe('/app/metrics/$metricId');

      // Metric with chat
      const metricChatRoute = assetParamsToRoute({
        assetType: 'metric',
        assetId: 'metric-123',
        chatId: 'chat-456',
      });
      expect(metricChatRoute).toBe('/app/chats/$chatId/metrics/$metricId');

      // Metric with chat and dashboard
      const metricChatDashRoute = assetParamsToRoute({
        assetType: 'metric',
        assetId: 'metric-123',
        chatId: 'chat-456',
        dashboardId: 'dash-789',
      });
      expect(metricChatDashRoute).toBe(
        '/app/chats/$chatId/dashboard/$dashboardId/metrics/$metricId'
      );
    });

    it('should handle dashboard asset type correctly', () => {
      // Dashboard only
      const dashRoute = assetParamsToRoute({
        assetType: 'dashboard',
        assetId: 'dash-123',
      });
      expect(dashRoute).toBe('/app/dashboards/$dashboardId');

      // Dashboard with chat
      const dashChatRoute = assetParamsToRoute({
        assetType: 'dashboard',
        assetId: 'dash-123',
        chatId: 'chat-456',
      });
      expect(dashChatRoute).toBe('/app/chats/$chatId/dashboard/$dashboardId');

      // Dashboard with chat and metric
      const dashChatMetricRoute = assetParamsToRoute({
        assetType: 'dashboard',
        assetId: 'dash-123',
        chatId: 'chat-456',
        metricId: 'metric-789',
      });
      expect(dashChatMetricRoute).toBe(
        '/app/chats/$chatId/dashboard/$dashboardId/metrics/$metricId'
      );
    });

    it('should handle report asset type correctly', () => {
      // Report only
      const reportRoute = assetParamsToRoute({
        assetType: 'report',
        assetId: 'report-123',
      });
      expect(reportRoute).toBe('/app/reports/$reportId');

      // Report with chat
      const reportChatRoute = assetParamsToRoute({
        assetType: 'report',
        assetId: 'report-123',
        chatId: 'chat-456',
      });
      expect(reportChatRoute).toBe('/app/chats/$chatId/report/$reportId');

      // Report with chat and metric
      const reportChatMetricRoute = assetParamsToRoute({
        assetType: 'report',
        assetId: 'report-123',
        chatId: 'chat-456',
        metricId: 'metric-789',
      });
      expect(reportChatMetricRoute).toBe('/app/chats/$chatId/report/$reportId/metrics/$metricId');
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
        createRouteBuilder().withChat('1').withDashboard('2').build(),
        createRouteBuilder().withChat('1').withMetric('2').build(),
        createRouteBuilder().withChat('1').withReport('2').build(),
        createRouteBuilder().withChat('1').withDashboard('2').withMetric('3').build(),
        createRouteBuilder().withChat('1').withReport('2').withMetric('3').build(),
      ];

      expect(routes).toBeDefined();
    });
  });
});
