import type { FileType, ReasoningFileType } from '@/api/asset_interfaces/chat';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';
import type {
  DashboardFileViewSecondary,
  MetricFileViewSecondary
} from '../../layouts/ChatLayout/ChatLayoutContext/useLayoutConfig';
import type { ReasoingMessage_ThoughtFileType } from '@buster/server-shared/chats';
import { createMetricRoute, type MetricRouteParams } from './createMetricRoute';
import { createDashboardRoute, type DashboardRouteParams } from './createDashboardRoute';
import { createReasoningRoute } from './createReasoningRoute';
import { createDatasetRoute } from './createDatasetRoute';

type UnionOfFileTypes = FileType | ReasoningFileType | ReasoingMessage_ThoughtFileType;

type OtherRouteParams = {
  assetId: string | undefined;
  chatId: string | undefined;
  versionNumber?: number;
  page?: undefined;
  secondaryView?: undefined | null | string;
  type: Exclude<UnionOfFileTypes, 'metric' | 'dashboard'>;
};

type BaseParams = MetricRouteParams | DashboardRouteParams | OtherRouteParams;

export const assetParamsToRoute = ({
  chatId,
  assetId,
  type,
  versionNumber,
  page,
  secondaryView
}: BaseParams): string => {
  if (!assetId && chatId) {
    return createBusterRoute({
      route: BusterRoutes.APP_CHAT_ID,
      chatId
    });
  }

  if (!assetId) {
    return '';
  }

  if (type === 'metric') {
    return createMetricRoute({
      assetId,
      chatId,
      secondaryView: secondaryView as MetricFileViewSecondary,
      versionNumber,
      page: page as MetricRouteParams['page']
    });
  }

  if (type === 'dashboard') {
    return createDashboardRoute({
      assetId,
      chatId,
      versionNumber,
      page,
      secondaryView: secondaryView as DashboardFileViewSecondary
    });
  }

  if (type === 'reasoning') {
    return createReasoningRoute({
      assetId,
      chatId
    });
  }

  if (type === 'dataset') {
    return createDatasetRoute({
      datasetId: assetId,
      chatId
    });
  }

  if (type === 'collection') {
    return createBusterRoute({
      route: BusterRoutes.APP_COLLECTIONS_ID,
      collectionId: assetId
    });
  }

  if (type === 'term') {
    return createBusterRoute({
      route: BusterRoutes.APP_TERMS_ID,
      termId: assetId
    });
  }

  if (type === 'todo') {
    return '';
  }

  if (type === 'agent-action') {
    return '';
  }

  if (type === 'topic') {
    return '';
  }

  if (type === 'value') {
    return '';
  }

  if (type === 'empty') {
    return '';
  }

  const exhaustiveCheck: never | undefined = type;

  console.warn('Asset params to route has not been implemented for this file type', type);
  return '';
};
