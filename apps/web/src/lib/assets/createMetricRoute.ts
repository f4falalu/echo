import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';
import type { MetricFileViewSecondary } from '../../layouts/ChatLayout/ChatLayoutContext/useLayoutConfig';

export type MetricRouteParams = {
  assetId: string;
  dashboardId?: string;
  chatId?: string;
  secondaryView?: MetricFileViewSecondary;
  versionNumber?: number;
  type: 'metric';
  page?: 'chart' | 'results' | 'sql' | undefined;
};

export const createMetricRoute = ({
  assetId: metricId,
  chatId,
  secondaryView,
  dashboardId,
  versionNumber: metricVersionNumber,
  page = 'chart'
}: Omit<MetricRouteParams, 'type'>) => {
  const baseParams = { metricVersionNumber, metricId, secondaryView };

  if (page === 'chart') {
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
