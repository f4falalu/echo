import { useAssetNavigationBlocker } from '../BusterAssets/useAssetNavigationBlocker';
import { useIsMetricChanged } from './useIsMetricChanged';

export const useIsMetricFileChanged = ({ metricId }: { metricId: string }) => {
  const { isFileChanged, onResetToOriginal } = useIsMetricChanged({ metricId });

  useAssetNavigationBlocker({
    isFileChanged,
    onResetToOriginal,
  });

  return { isFileChanged, onResetToOriginal };
};
