import { useMemo } from 'react';
import { useAssetNavigationBlocker } from '../BusterAssets/useAssetNavigationBlocker';
import { useIsDashboardChanged } from './useIsDashboardChanged';

export const useIsDashboardFileChanged = ({
  dashboardId,
  enabled = true,
}: {
  dashboardId: string;
  enabled?: boolean;
}) => {
  const { isFileChanged, onResetToOriginal } = useIsDashboardChanged({
    dashboardId,
    enabled,
  });

  useAssetNavigationBlocker({
    isFileChanged,
    onResetToOriginal: onResetToOriginal,
    enableBlocker: enabled,
  });

  return useMemo(() => ({ isFileChanged, onResetToOriginal }), [isFileChanged, onResetToOriginal]);
};
