import { useMemo } from 'react';
import { useGetReport } from '@/api/buster_rest/reports';
import { createDropdownItem } from '@/components/ui/dropdown';
import { ShareRight } from '@/components/ui/icons';
import { getIsEffectiveOwner } from '@/lib/share';
import { getShareAssetConfig, ShareMenuContent } from '../ShareMenu';

export const useShareMenuSelectMenu = ({ reportId }: { reportId: string }) => {
  const { data: shareAssetConfig } = useGetReport(
    { id: reportId },
    { select: getShareAssetConfig }
  );
  const isEffectiveOwner = getIsEffectiveOwner(shareAssetConfig?.permission);

  return useMemo(
    () =>
      createDropdownItem({
        label: 'Share',
        value: 'share-report',
        icon: <ShareRight />,
        disabled: !isEffectiveOwner,
        items:
          isEffectiveOwner && shareAssetConfig
            ? [
                <ShareMenuContent
                  key={reportId}
                  shareAssetConfig={shareAssetConfig}
                  assetId={reportId}
                  assetType={'report'}
                />,
              ]
            : undefined,
      }),
    [reportId, shareAssetConfig, isEffectiveOwner]
  );
};
