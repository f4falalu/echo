import type { AssetType } from '@buster/server-shared/assets';
import type { ResponseMessageFileType } from '@buster/server-shared/chats';
import { useCallback } from 'react';
import type { BusterMetricDataExtended } from '@/api/asset_interfaces/metric';
import { useGetMetricData } from '../../api/buster_rest/metrics';

export const useShowLoader = (
  assetId: string,
  type: AssetType | ResponseMessageFileType,
  versionNumber: number | undefined
) => {
  const { data: showLoader } = useGetMetricData(
    { id: assetId, versionNumber: versionNumber },
    {
      enabled: type === 'metric_file',
      select: useCallback(
        (x: BusterMetricDataExtended) => !x.data_metadata && type === 'metric_file',
        [type]
      ),
    }
  );

  return showLoader && type === 'metric_file';
};
