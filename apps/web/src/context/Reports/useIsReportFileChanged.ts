import { useMemo } from 'react';
import { useAssetNavigationBlocker } from '../BusterAssets/useAssetNavigationBlocker';
import { useIsReportChanged } from './useIsReportChanged';

export const useIsReportFileChanged = ({
  reportId,
  enabled = true,
}: {
  reportId: string;
  enabled?: boolean;
}) => {
  const { isFileChanged, onResetToOriginal } = useIsReportChanged({ reportId, enabled });

  useAssetNavigationBlocker({
    isFileChanged,
    onResetToOriginal,
    enableBlocker: enabled,
    assetType: 'report',
  });

  return useMemo(() => ({ isFileChanged, onResetToOriginal }), [isFileChanged, onResetToOriginal]);
};
