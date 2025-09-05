import type { AppSplitterRef } from '@/components/ui/layouts/AppSplitter';
import {
  useSelectedAssetId,
  useSelectedAssetType,
} from '@/context/BusterAssets/useSelectedAssetType';
import { useUpdateEffect } from '@/hooks/useUpdateEffect';
import { DEFAULT_CHAT_OPTION_SIDEBAR_SIZE } from '../config';

export const useAutoChatSplitter = ({
  appSplitterRef,
}: {
  appSplitterRef: React.RefObject<AppSplitterRef | null>;
}) => {
  const selectedAssetType = useSelectedAssetType();
  const selectedAssetId = useSelectedAssetId();
  const layoutTrigger = selectedAssetType === 'chat' ? 'chat' : !!selectedAssetId;

  const animateOpenSplitter = async (side: 'left' | 'right' | 'both') => {
    if (appSplitterRef.current) {
      const { animateWidth, getSizesInPixels } = appSplitterRef.current;
      const sizes = getSizesInPixels();
      const leftSize = sizes[0] ?? 0;
      const rightSize = sizes[1] ?? 0;

      if (side === 'left') {
        await animateWidth('100%', 'left');
      } else if (side === 'right') {
        await animateWidth('100%', 'right');
      } else if (side === 'both') {
        const shouldAnimate = Number(leftSize) < 200 || Number(rightSize) < 340;

        if (!shouldAnimate) return;

        await animateWidth(DEFAULT_CHAT_OPTION_SIDEBAR_SIZE, 'left');
      }
    }
  };

  useUpdateEffect(() => {
    const isSplitterClosed = appSplitterRef.current?.isSideClosed('right');
    if (isSplitterClosed && selectedAssetId) {
      animateOpenSplitter('both');
    } else {
      animateOpenSplitter('left');
    }
  }, [layoutTrigger]);
};
