import type { AssetType } from '@buster/server-shared/assets';
import { useCallback } from 'react';
import type { BusterMetricDataExtended } from '@/api/asset_interfaces/metric';
import { useGetMetricData } from '../../api/buster_rest/metrics';

export const useShowLoader = (
  assetId: string,
  type: AssetType,
  versionNumber: number | undefined
) => {
  const { data: showLoader } = useGetMetricData(
    {
      id: assetId,
      versionNumber: versionNumber,
    },
    {
      enabled: type === 'metric',
      select: useCallback(
        (x: BusterMetricDataExtended) => !x.data_metadata && type === 'metric',
        [type]
      ),
    }
  );

  return showLoader;
};
