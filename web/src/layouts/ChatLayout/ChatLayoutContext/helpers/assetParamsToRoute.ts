import { FileType } from '@/api/asset_interfaces/chat';
import {
  DashboardFileViewSecondary,
  FileViewSecondary,
  MetricFileViewSecondary
} from '../useLayoutConfig';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';

export const assetParamsToRoute = ({
  chatId,
  assetId,
  type,
  versionNumber,
  secondaryView: secondaryViewProp
}: {
  chatId: string | undefined;
  assetId: string;
  type: FileType;
  secondaryView?: FileViewSecondary;
  versionNumber?: number;
}) => {
  if (type === 'metric') {
    const secondaryView = secondaryViewProp as MetricFileViewSecondary | undefined;
    if (chatId) {
      switch (secondaryView) {
        case 'chart-edit': {
          if (versionNumber) {
            return createBusterRoute({
              route: BusterRoutes.APP_CHAT_ID_METRIC_ID_VERSION_NUMBER,
              chatId,
              metricId: assetId,
              versionNumber,
              secondaryView
            });
          }
          return createBusterRoute({
            route: BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART,
            chatId,
            metricId: assetId,
            secondaryView
          });
        }

        case 'sql-edit': {
          if (versionNumber) {
            return createBusterRoute({
              route: BusterRoutes.APP_CHAT_ID_METRIC_ID_VERSION_NUMBER,
              chatId,
              metricId: assetId,
              versionNumber,
              secondaryView
            });
          }
          return createBusterRoute({
            route: BusterRoutes.APP_CHAT_ID_METRIC_ID_RESULTS,
            chatId,
            metricId: assetId,
            secondaryView
          });
        }
        case 'version-history': {
          if (versionNumber) {
            return createBusterRoute({
              route: BusterRoutes.APP_CHAT_ID_METRIC_ID_VERSION_HISTORY_NUMBER,
              chatId,
              metricId: assetId,
              versionNumber
            });
          }
          return createBusterRoute({
            route: BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART,
            chatId,
            metricId: assetId,
            secondaryView
          });
        }
        default:
          const test: never | undefined = secondaryView;

          if (versionNumber) {
            return createBusterRoute({
              route: BusterRoutes.APP_CHAT_ID_METRIC_ID_VERSION_NUMBER,
              chatId,
              metricId: assetId,
              versionNumber
            });
          }
          return createBusterRoute({
            route: BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART,
            chatId,
            metricId: assetId
          });
      }
    }

    switch (secondaryView) {
      case 'chart-edit':
        return createBusterRoute({
          route: BusterRoutes.APP_METRIC_ID_CHART,
          metricId: assetId,
          secondaryView: secondaryView
        });
      case 'sql-edit':
        return createBusterRoute({
          route: BusterRoutes.APP_METRIC_ID_RESULTS,
          metricId: assetId,
          secondaryView: secondaryView
        });
      case 'version-history':
        return createBusterRoute({
          route: BusterRoutes.APP_METRIC_ID_CHART,
          metricId: assetId
        });
      default:
        const test: never | undefined = secondaryView;
        return createBusterRoute({
          route: BusterRoutes.APP_METRIC_ID_CHART,
          metricId: assetId
        });
    }
  }

  if (type === 'dashboard') {
    const secondaryView = secondaryViewProp as DashboardFileViewSecondary | undefined;
    if (chatId) {
      switch (secondaryView) {
        case 'version-history':
          return createBusterRoute({
            route: BusterRoutes.APP_CHAT_ID_DASHBOARD_ID,
            chatId,
            dashboardId: assetId
          });
      }
    }

    return createBusterRoute({
      route: BusterRoutes.APP_DASHBOARD_ID,
      dashboardId: assetId
    });
  }

  console.warn('Asset params to route has not been implemented for this file type', type);

  return '';
};
