import { FileType } from '@/api/asset_interfaces/chat';
import {
  DashboardFileViewSecondary,
  FileViewSecondary,
  MetricFileViewSecondary
} from '../useLayoutConfig';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';

type BaseParams = {
  chatId: string | undefined;
  assetId: string;
  type: FileType;
  secondaryView?: FileViewSecondary;
  versionNumber?: number;
};

type MetricRouteParams = {
  metricId: string;
  chatId?: string;
  secondaryView?: MetricFileViewSecondary;
  versionNumber?: number;
};

const createMetricRoute = ({
  metricId,
  chatId,
  secondaryView,
  versionNumber
}: MetricRouteParams) => {
  const baseParams = { versionNumber, metricId, secondaryView };

  if (chatId) {
    if (versionNumber) {
      return createBusterRoute({
        route: BusterRoutes.APP_CHAT_ID_METRIC_ID_VERSION_NUMBER,
        chatId,
        ...baseParams,
        versionNumber
      });
    }

    switch (secondaryView) {
      case 'chart-edit':
        return createBusterRoute({
          route: BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART,
          chatId,
          ...baseParams
        });
      case 'sql-edit':
        return createBusterRoute({
          route: BusterRoutes.APP_CHAT_ID_METRIC_ID_RESULTS,
          chatId,
          ...baseParams
        });
      case 'version-history':
        return createBusterRoute({
          route: BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART,
          chatId,
          ...baseParams
        });
      default:
        const test: never | undefined = secondaryView;
        return createBusterRoute({
          route: BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART,
          chatId,
          metricId
        });
    }
  }

  // Non-chat metric routes

  if (versionNumber) {
    return createBusterRoute({
      route: BusterRoutes.APP_METRIC_ID_VERSION_NUMBER,
      ...baseParams
    });
  }

  switch (secondaryView) {
    case 'chart-edit':
      return createBusterRoute({
        route: BusterRoutes.APP_METRIC_ID_CHART,
        ...baseParams
      });
    case 'sql-edit':
      return createBusterRoute({
        route: BusterRoutes.APP_METRIC_ID_RESULTS,
        ...baseParams
      });
    case 'version-history':
    //
    default:
      return createBusterRoute({
        route: BusterRoutes.APP_METRIC_ID_CHART,
        metricId
      });
  }
};

const createDashboardRoute = ({
  dashboardId,
  chatId,
  secondaryView,
  versionNumber
}: {
  dashboardId: string;
  chatId?: string;
  secondaryView?: DashboardFileViewSecondary;
  versionNumber?: number;
}) => {
  if (chatId) {
    if (versionNumber) {
      return createBusterRoute({
        route: BusterRoutes.APP_CHAT_ID_DASHBOARD_ID_VERSION_NUMBER,
        chatId,
        dashboardId,
        versionNumber,
        secondaryView
      });
    }

    return createBusterRoute({
      route: BusterRoutes.APP_CHAT_ID_DASHBOARD_ID,
      chatId,
      dashboardId,
      secondaryView
    });
  }

  if (versionNumber) {
    return createBusterRoute({
      route: BusterRoutes.APP_DASHBOARD_ID_VERSION_NUMBER,
      dashboardId,
      versionNumber,
      secondaryView
    });
  }

  return createBusterRoute({
    route: BusterRoutes.APP_DASHBOARD_ID,
    dashboardId,
    secondaryView
  });
};

export const assetParamsToRoute = ({
  chatId,
  assetId,
  type,
  versionNumber,
  secondaryView
}: BaseParams) => {
  if (type === 'metric') {
    return createMetricRoute({
      metricId: assetId,
      chatId,
      secondaryView: secondaryView as MetricFileViewSecondary,
      versionNumber
    });
  }

  if (type === 'dashboard') {
    return createDashboardRoute({
      dashboardId: assetId,
      chatId,
      versionNumber,
      secondaryView: secondaryView as DashboardFileViewSecondary
    });
  }

  console.warn('Asset params to route has not been implemented for this file type', type);
  return '';
};
