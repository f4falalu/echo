import React, { useMemo } from 'react';
import type { DropdownItem } from '@/components/ui/dropdown';
import { WandSparkle } from '@/components/ui/icons';
import { FollowUpWithAssetContent } from '@/components/features/popups/FollowUpWithAsset';

export const useMetricDrilldownItem = ({ metricId }: { metricId: string }): DropdownItem => {
  return useMemo(
    () => ({
      value: 'drilldown',
      label: 'Drill down & filter',
      items: [
        <FollowUpWithAssetContent
          key="drilldown-and-filter"
          assetType="metric"
          assetId={metricId}
          placeholder="Describe how you want to drill down or filter..."
          buttonText="Submit request"
          mode="drilldown"
        />
      ],
      icon: <WandSparkle />
    }),
    [metricId]
  );
};
