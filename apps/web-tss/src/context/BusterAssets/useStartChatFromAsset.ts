import type { ChatAssetType } from '@buster/server-shared/chats';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useStartChatFromAsset as useStartChatFromAssetRest } from '@/api/buster_rest/chats';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';

export const useStartChatFromAsset = ({
  assetId,
  assetType,
}: {
  assetId: string;
  assetType: ChatAssetType;
}) => {
  const [loading, setLoading] = useState(false);
  const { mutateAsync: startChatFromAsset, isPending } = useStartChatFromAssetRest();
  const navigate = useNavigate();

  const onCreateFileClick = useMemoizedFn(async () => {
    setLoading(true);
    try {
      const result = await startChatFromAsset({ asset_id: assetId, asset_type: assetType });

      if (assetType === 'metric') {
        await navigate({
          to: '/app/chats/$chatId/metrics/$metricId',
          params: {
            metricId: assetId,
            chatId: result.id,
          },
        });
      } else if (assetType === 'dashboard') {
        await navigate({
          to: '/app/chats/$chatId/dashboards/$dashboardId',
          params: {
            dashboardId: assetId,
            chatId: result.id,
          },
        });
      } else if (assetType === 'report') {
        await navigate({
          to: '/app/chats/$chatId/report/$reportId',
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
