import React from 'react';
import { ShareButton } from './ShareButton';
import { ShareMenu } from '../ShareMenu';
import { ShareAssetType } from '@/api/asset_interfaces';
import { useGetMetric } from '@/api/buster_rest/metrics';

export const ShareMetricButton = React.memo(({ metricId }: { metricId: string }) => {
  const { data: metric } = useGetMetric(metricId);

  return (
    <ShareMenu
      shareAssetConfig={metric || null}
      assetId={metricId}
      assetType={ShareAssetType.METRIC}>
      <ShareButton />
    </ShareMenu>
  );
});

ShareMetricButton.displayName = 'ShareMetricButton';
