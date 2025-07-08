import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';
import type { MetricFileViewSecondary } from '../../layouts/ChatLayout/ChatLayoutContext/useLayoutConfig';

export type MetricRouteParams = {
  assetId: string;
  dashboardId?: string;
  chatId?: string;
  secondaryView?: MetricFileViewSecondary;
  metricVersionNumber?: number;
  dashboardVersionNumber?: number;
  type: 'metric';
  page?: 'chart' | 'results' | 'sql' | undefined;
  versionNumber?: number; //will first try and use metricVersionNumber assuming it is a metric, then dashboardVersionNumber assuming it is a dashboard, then versionNumber
};

export const createMetricRoute = ({
  assetId: metricId,
  chatId,
  secondaryView,
  dashboardId,
  metricVersionNumber: _metricVersionNumber,
  dashboardVersionNumber,
  versionNumber,
  page = 'chart'
}: Omit<MetricRouteParams, 'type'>) => {
  const metricVersionNumber = _metricVersionNumber || versionNumber;
  const baseParams = { metricVersionNumber, dashboardVersionNumber, metricId, secondaryView };

  if (page === 'chart') {
    // Check for dashboardId first (requires chatId as well)
    if (dashboardId && chatId) {
      switch (secondaryView) {
        case 'chart-edit':
          return createBusterRoute({
            route: BusterRoutes.APP_CHAT_ID_DASHBOARD_ID_METRIC_ID_CHART,
            chatId,
            dashboardId,
            ...baseParams
          });
        case 'version-history':
          return createBusterRoute({
            route: BusterRoutes.APP_CHAT_ID_DASHBOARD_ID_METRIC_ID_CHART,
            chatId,
            dashboardId,
            ...baseParams
          });
        default: {
          const test: never | undefined = secondaryView;

          return createBusterRoute({
            route: BusterRoutes.APP_CHAT_ID_DASHBOARD_ID_METRIC_ID_CHART,
            chatId,
            dashboardId,
            ...baseParams
          });
        }
      }
    }

    if (chatId) {
      switch (secondaryView) {
        case 'chart-edit':
          return createBusterRoute({
            route: BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART,
            chatId,
            ...baseParams
          });
        case 'version-history':
          return createBusterRoute({
            route: BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART,
            chatId,
            ...baseParams
          });
        default: {
          const test: never | undefined = secondaryView;

          return createBusterRoute({
            route: BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART,
            chatId,
            ...baseParams
          });
        }
      }
    }

    // Non-chat metric routes

    switch (secondaryView) {
      case 'chart-edit':
        return createBusterRoute({
          route: BusterRoutes.APP_METRIC_ID_CHART,
          ...baseParams
        });
      default:
        return createBusterRoute({
          route: BusterRoutes.APP_METRIC_ID_CHART,
          ...baseParams
        });
    }
  }

  if (page === 'results') {
    // Check for dashboardId first (requires chatId as well)
    if (dashboardId && chatId) {
      return createBusterRoute({
        route: BusterRoutes.APP_CHAT_ID_DASHBOARD_ID_METRIC_ID_RESULTS,
        chatId,
        dashboardId,
        ...baseParams
      });
    }

    if (chatId) {
      return createBusterRoute({
        route: BusterRoutes.APP_CHAT_ID_METRIC_ID_RESULTS,
        chatId,
        ...baseParams
      });
    }

    // Non-chat metric routes

    return createBusterRoute({
      route: BusterRoutes.APP_METRIC_ID_CHART,
      ...baseParams
    });
  }

  if (page === 'sql') {
    // Check for dashboardId first (requires chatId as well)
    if (dashboardId && chatId) {
      return createBusterRoute({
        route: BusterRoutes.APP_CHAT_ID_DASHBOARD_ID_METRIC_ID_SQL,
        chatId,
        dashboardId,
        ...baseParams
      });
    }

    if (chatId) {
      return createBusterRoute({
        route: BusterRoutes.APP_CHAT_ID_METRIC_ID_SQL,
        chatId,
        ...baseParams
      });
    }

    // Non-chat metric routes
    return createBusterRoute({
      route: BusterRoutes.APP_METRIC_ID_SQL,
      ...baseParams
    });
  }

  const _exhaustiveCheck: never = page;

  return '';
};
