import type { FileType, AllFileTypes } from '@/api/asset_interfaces';
import { BusterRoutes, createBusterRoute } from '@/routes';
import type { FileView } from './useLayoutConfig';

const chatRouteRecord: Record<AllFileTypes, (chatId: string, assetId: string) => string> = {
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
      route: BusterRoutes.APP_CHAT_ID_METRIC_ID,
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

export const createChatAssetRoute = ({
  chatId,
  assetId,
  type
}: {
  chatId: string;
  assetId: string;
  type: FileType;
}) => {
  const routeBuilder = chatRouteRecord[type];
  if (!routeBuilder) return null;
  return routeBuilder(chatId, assetId);
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
