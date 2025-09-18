import React from 'react';
import { useGetReport } from '@/api/buster_rest/reports';
import { ShareMenu } from '../ShareMenu';
import { getShareAssetConfig } from '../ShareMenu/helpers';
import { ShareButton } from './ShareButton';

export const ShareReportButton = React.memo(({ reportId }: { reportId: string }) => {
  const { data: shareAssetConfig } = useGetReport(
    { id: reportId },
    { select: getShareAssetConfig }
  );

  return (
    <ShareMenu
      shareAssetConfig={shareAssetConfig || null}
      assetId={reportId}
      assetType={'report_file'}
    >
      <ShareButton />
    </ShareMenu>
  );
});

ShareReportButton.displayName = 'ShareReportButton';
