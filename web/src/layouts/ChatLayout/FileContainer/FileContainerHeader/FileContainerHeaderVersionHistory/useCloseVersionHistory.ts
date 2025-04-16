import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useMemoizedFn } from '@/hooks';
import { useGetInitialChatFile } from '@/layouts/ChatLayout/ChatContext/useGetInitialChatFile';
import { useChatLayoutContextSelector } from '@/layouts/ChatLayout/ChatLayoutContext';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';
import { useMemo } from 'react';

export const useCloseVersionHistory = () => {
  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);
  const chatId = useChatLayoutContextSelector((x) => x.chatId);
  const metricId = useChatLayoutContextSelector((x) => x.metricId);
  const dashboardId = useChatLayoutContextSelector((x) => x.dashboardId);
  const messageId = useChatLayoutContextSelector((x) => x.messageId);
  const getInitialChatFileHref = useGetInitialChatFile();

  const href = useMemo(() => {
    if (!chatId) {
      return createBusterRoute({
        route: BusterRoutes.APP_METRIC_ID_CHART,
        metricId: metricId!
      });
    }

    return (
      getInitialChatFileHref({
        metricId,
        dashboardId,
        chatId,
        secondaryView: null,
        dashboardVersionNumber: undefined,
        metricVersionNumber: undefined,
        messageId
      }) || 'error'
    );
  }, [chatId, messageId, metricId, dashboardId]);

  const onCloseVersionHistory = useMemoizedFn(() => {
    onChangePage(href);
  });

  return { href, onCloseVersionHistory };
};
