import React from 'react';
import { ShareButton } from './ShareButton';
import { ShareMenu } from '../ShareMenu';
import { ShareAssetType } from '@/api/asset_interfaces';
import { useBusterMetricIndividual } from '@/context/Metrics/BusterMetricsIndividualProvider/useBusterMetricIndividual';

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
