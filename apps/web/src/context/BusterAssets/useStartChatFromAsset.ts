import type { ChatAssetType } from '@buster/server-shared/chats';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useStartChatFromAssetBase } from '@/api/buster_rest/chats';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';

export const useStartChatFromAsset = ({
  assetId,
  assetType,
  prompt,
}: {
  assetId: string;
  assetType: ChatAssetType;
  prompt?: string;
}) => {
  const [loading, setLoading] = useState(false);
  const { mutateAsync: startChatFromAsset, isPending } = useStartChatFromAssetBase();
  const navigate = useNavigate();

  const onCreateFileClick = useMemoizedFn(async () => {
    setLoading(true);
    try {
      const result = await startChatFromAsset({ asset_id: assetId, asset_type: assetType, prompt });

      if (assetType === 'metric_file') {
        await navigate({
          to: '/app/chats/$chatId/metrics/$metricId/chart',
          params: {
            metricId: assetId,
            chatId: result.id,
          },
        });
      } else if (assetType === 'dashboard_file') {
        await navigate({
          to: '/app/chats/$chatId/dashboards/$dashboardId',
          params: {
            dashboardId: assetId,
            chatId: result.id,
          },
        });
      } else if (assetType === 'report_file') {
        await navigate({
          to: '/app/chats/$chatId/reports/$reportId',
          params: {
            reportId: assetId,
            chatId: result.id,
          },
        });
      } else {
        const _exhaustiveCheck: never = assetType;
      }
    } catch (error) {
      //
    } finally {
      setLoading(false);
    }
  });

  return { onCreateFileClick, loading: loading || isPending };
};
