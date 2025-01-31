import type { FileType } from '@/api/asset_interfaces';
import { BusterRoutes, createBusterRoute } from '@/routes';

const chatRouteRecord: Record<FileType, (chatId: string, assetId: string) => string> = {
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
    })
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
  if (!routeBuilder) return '';
  return routeBuilder(chatId, assetId);
};

const fileRouteRecord: Record<FileType, (assetId: string) => string> = {
  collection: (assetId) =>
    createBusterRoute({ route: BusterRoutes.APP_COLLECTIONS_ID, collectionId: assetId }),
  dataset: (assetId) =>
    createBusterRoute({ route: BusterRoutes.APP_DATASETS_ID, datasetId: assetId }),
  metric: (assetId) => createBusterRoute({ route: BusterRoutes.APP_METRIC_ID, metricId: assetId }),
  dashboard: (assetId) =>
    createBusterRoute({ route: BusterRoutes.APP_DASHBOARD_ID, dashboardId: assetId }),
  term: (assetId) => createBusterRoute({ route: BusterRoutes.APP_TERMS_ID, termId: assetId }),
  value: (assetId) => createBusterRoute({ route: BusterRoutes.APP_VALUE_ID, valueId: assetId })
};

export const createFileRoute = ({ assetId, type }: { assetId: string; type: FileType }) => {
  const routeBuilder = fileRouteRecord[type];
  if (!routeBuilder) return '';
  return routeBuilder(assetId);
};
