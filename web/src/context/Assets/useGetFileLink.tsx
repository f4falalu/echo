import { FileType } from '@/api/asset_interfaces/chat';
import { useMemoizedFn } from '@/hooks';
import { useChatLayoutContextSelector } from '@/layouts/ChatLayout';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';

export const useGetFileLink = () => {
  const metricVersionNumber = useChatLayoutContextSelector((x) => x.metricVersionNumber);
  const dashboardVersionNumber = useChatLayoutContextSelector((x) => x.dashboardVersionNumber);
  const metricId = useChatLayoutContextSelector((x) => x.metricId);
  const dashboardId = useChatLayoutContextSelector((x) => x.dashboardId);

  const getFileLink = useMemoizedFn(
    ({
      fileId,
      fileType,
      chatId,
      versionNumber,
      useVersionHistoryMode = false
    }: {
      fileId: string;
      fileType: FileType;
      chatId?: string;
      versionNumber?: number;
      useVersionHistoryMode?: boolean;
    }) => {
      if (fileType === 'metric') {
        if (chatId) {
          if (versionNumber) {
            if (useVersionHistoryMode) {
              return createBusterRoute({
                route: BusterRoutes.APP_CHAT_ID_METRIC_ID_VERSION_HISTORY_NUMBER,
                chatId,
                metricId: fileId,
                versionNumber
              });
            } else {
              return createBusterRoute({
                route: BusterRoutes.APP_CHAT_ID_METRIC_ID_VERSION_NUMBER,
                chatId,
                metricId: fileId,
                versionNumber
              });
            }
          } else {
            return createBusterRoute({
              route: BusterRoutes.APP_CHAT_ID_METRIC_ID,
              chatId,
              metricId: fileId
            });
          }
        } else {
          if (versionNumber) {
            return createBusterRoute({
              route: BusterRoutes.APP_METRIC_ID_VERSION_HISTORY_NUMBER,
              metricId: fileId,
              versionNumber
            });
          } else {
            return createBusterRoute({
              route: BusterRoutes.APP_METRIC_ID_CHART,
              metricId: fileId
            });
          }
        }
      } else if (fileType === 'dashboard') {
        if (chatId) {
          if (versionNumber) {
            if (useVersionHistoryMode) {
              return createBusterRoute({
                route: BusterRoutes.APP_CHAT_ID_DASHBOARD_ID_VERSION_HISTORY_NUMBER,
                chatId,
                dashboardId: fileId,
                versionNumber
              });
            } else {
              return createBusterRoute({
                route: BusterRoutes.APP_CHAT_ID_DASHBOARD_ID_VERSION_NUMBER,
                chatId,
                dashboardId: fileId,
                versionNumber
              });
            }
          } else {
            return createBusterRoute({
              route: BusterRoutes.APP_CHAT_ID_DASHBOARD_ID,
              chatId,
              dashboardId: fileId
            });
          }
        } else {
          if (versionNumber) {
            return createBusterRoute({
              route: BusterRoutes.APP_DASHBOARD_ID_VERSION_HISTORY_NUMBER,
              dashboardId: fileId,
              versionNumber
            });
          } else {
            return createBusterRoute({
              route: BusterRoutes.APP_DASHBOARD_ID,
              dashboardId: fileId
            });
          }
        }
      }
    }
  );

  const getFileIsSelected = useMemoizedFn(
    ({
      versionNumber,
      fileType,
      fileId
    }: {
      versionNumber?: number;
      fileType: FileType;
      fileId: string;
    }) => {
      if (fileType === 'metric') {
        return versionNumber === metricVersionNumber && fileId === metricId;
      } else if (fileType === 'dashboard') {
        return versionNumber === dashboardVersionNumber && fileId === dashboardId;
      }
    }
  );

  const getFileLinkMeta = useMemoizedFn(
    ({
      fileId,
      fileType,
      chatId,
      versionNumber,
      useVersionHistoryMode = false
    }: {
      fileId: string;
      fileType: FileType;
      chatId?: string;
      versionNumber?: number;
      useVersionHistoryMode?: boolean;
    }) => {
      const link = getFileLink({ fileId, fileType, chatId, versionNumber, useVersionHistoryMode });
      const isSelected = getFileIsSelected({ versionNumber, fileType, fileId });

      const selectedVersionNumber = metricVersionNumber || dashboardVersionNumber;

      return { link, isSelected, selectedVersionNumber };
    }
  );

  return { getFileLinkMeta, getFileLink, getFileIsSelected };
};
