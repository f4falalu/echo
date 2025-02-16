import React from 'react';
import { ShareButton } from './ShareButton';
import { ShareMenu } from '../ShareMenu';
import { ShareAssetType } from '@/api/asset_interfaces';
import { useMetricIndividual } from '@/context/Metrics/BusterMetricsIndividualProvider';

export const ShareMetricButton = React.memo(({ metricId }: { metricId: string }) => {
  const { metric } = useMetricIndividual({ metricId });

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
