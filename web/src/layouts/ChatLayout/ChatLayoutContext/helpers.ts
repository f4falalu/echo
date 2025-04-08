import type { FileType, AllFileTypes } from '@/api/asset_interfaces';
import { BusterRoutes, createBusterRoute } from '@/routes';
import type {
  DashboardFileViewSecondary,
  FileView,
  FileViewSecondary,
  MetricFileViewSecondary
} from './useLayoutConfig';

const chatRouteRecord: Record<AllFileTypes, (chatId: string, assetId: string) => string | null> = {
  collection: (chatId, assetId) =>
    createBusterRoute({
      route: BusterRoutes.APP_CHAT_ID_COLLECTION_ID,
      chatId,
      collectionId: assetId
    }),
  dataset: (chatId, assetId) =>
    createBusterRoute({
      route: BusterRoutes.APP_CHAT_ID_DATASET_ID,
      chatId,
      datasetId: assetId
    }),
  metric: (chatId, assetId) =>
    createBusterRoute({
      route: BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART,
      chatId,
      metricId: assetId
    }),
  dashboard: (chatId, assetId) =>
    createBusterRoute({
      route: BusterRoutes.APP_CHAT_ID_DASHBOARD_ID,
      chatId,
      dashboardId: assetId
    }),
  term: (chatId, assetId) =>
    createBusterRoute({
      route: BusterRoutes.APP_CHAT_ID_TERM_ID,
      chatId,
      termId: assetId
    }),
  value: (chatId, assetId) =>
    createBusterRoute({
      route: BusterRoutes.APP_CHAT_ID_VALUE_ID,
      chatId,
      valueId: assetId
    }),
  reasoning: (chatId, assetId) =>
    createBusterRoute({
      route: BusterRoutes.APP_CHAT_ID_REASONING_ID,
      chatId,
      messageId: assetId
    }),
  empty: () => ''
};

const assetRouteRecord: Record<AllFileTypes, (assetId: string) => string | null> = {
  collection: (assetId) =>
    createBusterRoute({
      route: BusterRoutes.APP_COLLECTIONS_ID,
      collectionId: assetId
    }),
  dataset: (assetId) =>
    createBusterRoute({
      route: BusterRoutes.APP_DATASETS_ID,
      datasetId: assetId
    }),
  metric: (assetId) =>
    createBusterRoute({
      route: BusterRoutes.APP_METRIC_ID_CHART,
      metricId: assetId
    }),
  dashboard: (assetId) =>
    createBusterRoute({
      route: BusterRoutes.APP_DASHBOARD_ID,
      dashboardId: assetId
    }),
  term: (assetId) =>
    createBusterRoute({
      route: BusterRoutes.APP_TERMS_ID,
      termId: assetId
    }),
  value: (assetId) =>
    createBusterRoute({
      route: BusterRoutes.APP_VALUE_ID,
      valueId: assetId
    }),
  reasoning: () => null,
  empty: () => null
};

export const createChatAssetRoute = ({
  chatId,
  assetId,
  type
}: {
  chatId: string | undefined;
  assetId: string;
  type: FileType;
}) => {
  const routeBuilder = chatRouteRecord[type];
  if (!routeBuilder) return null;
  if (chatId) return routeBuilder(chatId, assetId);

  const assetRouteBuilder = assetRouteRecord[type];
  if (!assetRouteBuilder) return null;
  return assetRouteBuilder(assetId);
};

const routeToFileView: Partial<Record<BusterRoutes, FileView>> = {
  [BusterRoutes.APP_METRIC_ID_CHART]: 'chart',
  [BusterRoutes.APP_METRIC_ID_RESULTS]: 'results',
  [BusterRoutes.APP_METRIC_ID_FILE]: 'file',
  [BusterRoutes.APP_CHAT_ID_METRIC_ID]: 'file',
  [BusterRoutes.APP_CHAT_ID_METRIC_ID_FILE]: 'file',
  [BusterRoutes.APP_CHAT_ID_METRIC_ID_RESULTS]: 'results',
  [BusterRoutes.APP_CHAT_ID_DASHBOARD_ID]: 'dashboard',
  [BusterRoutes.APP_CHAT_ID_DASHBOARD_ID_FILE]: 'file'
};

export const getFileViewFromRoute = (route: BusterRoutes) => {
  return routeToFileView[route];
};

export const DEFAULT_FILE_VIEW: Record<FileType, FileView> = {
  metric: 'chart',
  dashboard: 'dashboard',
  reasoning: 'reasoning'
  // collection: 'results',
  // value: 'results',
  // term: 'results',
  // dataset: 'results',
};

export const assetParamsToRoute = ({
  chatId,
  assetId,
  type,
  secondaryView: secondaryViewProp
}: {
  chatId: string | undefined;
  assetId: string;
  type: FileType;
  secondaryView?: FileViewSecondary;
}) => {
  if (type === 'metric') {
    const secondaryView = secondaryViewProp as MetricFileViewSecondary | undefined;
    if (chatId) {
      switch (secondaryView) {
        case 'chart-edit':
          return createBusterRoute({
            route: BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART,
            chatId,
            metricId: assetId
          });
        case 'sql-edit':
          return createBusterRoute({
            route: BusterRoutes.APP_CHAT_ID_METRIC_ID_RESULTS,
            chatId,
            metricId: assetId
          });
        case 'version-history':
          return createBusterRoute({
            route: BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART,
            chatId,
            metricId: assetId
          });
        default:
          const test: never | undefined = secondaryView;
          return '';
      }
    }

    switch (secondaryView) {
      case 'chart-edit':
        return createBusterRoute({
          route: BusterRoutes.APP_METRIC_ID_CHART,
          metricId: assetId
        });
      case 'sql-edit':
        return createBusterRoute({
          route: BusterRoutes.APP_METRIC_ID_RESULTS,
          metricId: assetId
        });
      case 'version-history':
        return createBusterRoute({
          route: BusterRoutes.APP_METRIC_ID_CHART,
          metricId: assetId
        });
      default:
        const test: never | undefined = secondaryView;
        return '';
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

  return createChatAssetRoute({ chatId, assetId, type }) || '';
};
