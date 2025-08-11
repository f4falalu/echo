import React from 'react';
import { useGetReport } from '@/api/buster_rest/reports';
import { ShareMenu } from '../ShareMenu';
import { getShareAssetConfig } from '../ShareMenu/helpers';
import { ShareButton } from './ShareButton';

export const ShareReportButton = React.memo(({ reportId }: { reportId: string }) => {
  const { data: shareAssetConfig } = useGetReport({ reportId }, { select: getShareAssetConfig });

  return (
    <ShareMenu shareAssetConfig={shareAssetConfig || null} assetId={reportId} assetType={'report'}>
      <ShareButton />
    </ShareMenu>
  );
});

ShareReportButton.displayName = 'ShareReportButton';
