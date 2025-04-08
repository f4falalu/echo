import { BusterChatResponseMessage_file } from '@/api/asset_interfaces/chat';
import { BusterRoutes } from '@/routes';

import { createBusterRoute } from '@/routes';
import { useMemo } from 'react';

export const useGetFileHref = ({
  responseMessage,
  isSelectedFile,
  isLatestVersion,
  chatId
}: {
  responseMessage: BusterChatResponseMessage_file;
  isSelectedFile: boolean;
  isLatestVersion: boolean;
  chatId: string;
}) => {
  const { file_type, id, version_number } = responseMessage;

  const href = useMemo(() => {
    if (!chatId) return '';

    if (isSelectedFile) {
      return createBusterRoute({
        route: BusterRoutes.APP_CHAT_ID,
        chatId
      });
    }

    if (file_type === 'metric') {
      if (isLatestVersion) {
        return createBusterRoute({
          route: BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART,
          chatId,
          metricId: id
        });
      }

      return createBusterRoute({
        route: BusterRoutes.APP_CHAT_ID_METRIC_ID_VERSION_NUMBER,
        chatId,
        metricId: id,
        versionNumber: version_number.toString()
      });
    }

    if (file_type === 'dashboard') {
      if (isLatestVersion) {
        return createBusterRoute({
          route: BusterRoutes.APP_CHAT_ID_DASHBOARD_ID,
          chatId,
          dashboardId: id
        });
      }

      return createBusterRoute({
        route: BusterRoutes.APP_CHAT_ID_DASHBOARD_ID_VERSION_NUMBER,
        chatId,
        dashboardId: id,
        versionNumber: version_number.toString()
      });
    }

    console.warn('Unknown file type', file_type);

    return '';
  }, [chatId, file_type, id, version_number, isSelectedFile]);

  return href;
};
