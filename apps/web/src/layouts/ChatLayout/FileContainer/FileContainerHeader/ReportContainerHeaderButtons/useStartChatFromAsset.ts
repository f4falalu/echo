import { useStartChatFromAsset } from '@/api/buster_rest/chats';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { useChatLayoutContextSelector } from '@/layouts/ChatLayout/ChatLayoutContext';
import { timeout } from '@/lib/timeout';
import { BusterRoutes } from '@/routes/busterRoutes';
import type { ChatAssetType } from '@buster/server-shared/chats';
import { useState } from 'react';

export const useStartChatFromReport = ({
  assetId,
  assetType
}: {
  assetId: string;
  assetType: ChatAssetType;
}) => {
  const [loading, setLoading] = useState(false);
  const { mutateAsync: startChatFromAsset, isPending } = useStartChatFromAsset();
  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);
  const onSetFileView = useChatLayoutContextSelector((x) => x.onSetFileView);

  const onCreateFileClick = useMemoizedFn(async () => {
    setLoading(true);
    try {
      const result = await startChatFromAsset({ asset_id: assetId, asset_type: assetType });

      if (assetType === 'metric') {
        await onChangePage({
          route: BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART,
          metricId: assetId,
          chatId: result.id
        });
      } else if (assetType === 'dashboard') {
        await onChangePage({
          route: BusterRoutes.APP_CHAT_ID_DASHBOARD_ID,
          dashboardId: assetId,
          chatId: result.id
        });
      } else if (assetType === 'report') {
        await onChangePage({
          route: BusterRoutes.APP_CHAT_ID_REPORT_ID,
          reportId: assetId,
          chatId: result.id
        });
      } else {
        const _exhaustiveCheck: never = assetType;
      }

      await timeout(250); //wait for the chat to load and the file to be selected
      onSetFileView({
        fileId: assetId,
        fileView: 'chart'
      });
    } catch (error) {
      //
    } finally {
      setLoading(false);
    }
  });

  return { onCreateFileClick, loading: loading || isPending };
};
