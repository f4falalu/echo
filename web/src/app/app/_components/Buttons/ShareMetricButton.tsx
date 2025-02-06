import React from 'react';
import { ShareButton } from './ShareButton';
import { useBusterMetricIndividual } from '@/context/Metrics';
import { ShareMenu } from '../ShareMenu';
import { ShareAssetType } from '@/api/asset_interfaces';

export const ShareMetricButton = React.memo(({ metricId }: { metricId: string }) => {
  const { metric } = useBusterMetricIndividual({ metricId });

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
