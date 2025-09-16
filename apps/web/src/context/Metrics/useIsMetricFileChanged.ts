import { useMemo } from 'react';
import { useAssetNavigationBlocker } from '../BusterAssets/useAssetNavigationBlocker';
import { useIsMetricChanged } from './useIsMetricChanged';

export const useIsMetricFileChanged = ({
  metricId,
  enabled = true,
}: {
  metricId: string;
  enabled?: boolean;
}) => {
  const { isFileChanged, onResetToOriginal } = useIsMetricChanged({ metricId, enabled });

  useAssetNavigationBlocker({
    isFileChanged,
    onResetToOriginal,
    enableBlocker: enabled,
    assetType: 'metric',
  });

  return useMemo(() => ({ isFileChanged, onResetToOriginal }), [isFileChanged, onResetToOriginal]);
};
